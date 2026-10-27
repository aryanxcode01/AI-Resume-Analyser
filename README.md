# AI Resume Analyzer

A privacy-minded web application for estimating resume ATS readiness and job fit. Scores are estimates, not replicas of any employer's applicant-tracking system.

## Stack

- Client: React, Vite, Tailwind CSS
- Server: Node.js, Express, MongoDB/Mongoose
- AI (Phase 2): Gemini via a provider interface

## Local setup

1. Install Node.js 24 or later.
2. Copy `.env.example` to `.env` and fill in `MONGODB_URI` when you have a free MongoDB Atlas database. Gemini is not needed until Phase 2.
3. Install dependencies: `npm install`.
4. Start both apps: `npm run dev`.
5. Open `http://localhost:5173`; verify `http://localhost:4000/health` returns `ok`.

## Scripts

- `npm run dev` — run client and server together
- `npm run build` — create a production client build and verify server syntax
- `npm run lint` — lint all workspaces
- `npm run format:check` — check formatting

## Environment and privacy

Never commit `.env`. The server is intentionally configured to avoid logging resume text. Uploaded binaries remain only in memory during extraction; the database stores the extracted text needed for analysis. Use a Bearer access token returned by registration/login for protected API routes.

## Phase 1 API

- `POST /api/auth/register` — `{ "email", "password" }`; password requires 12+ characters
- `POST /api/auth/login` — `{ "email", "password" }`
- `GET /api/auth/me` — requires `Authorization: Bearer <token>`
- `POST /api/resumes` — requires the same Bearer token and multipart field `resume`; accepts only valid PDF/DOCX files up to 5 MB

Image-only and overly short documents return a clear `UNREADABLE_DOCUMENT` response. The API does not currently run OCR.

## Phase 2 API

- `POST /api/analyses` — `{ "resumeId", "jobDescription"? }`; requires a Bearer token and returns estimated ATS readiness, a per-check breakdown, structured profile, recommendations, and—when a job description is present—job match plus skill gaps.
- `GET /api/analyses` and `GET /api/analyses/:analysisId` — authenticated saved-analysis history and detail.
- `DELETE /api/analyses/:analysisId` — delete one saved analysis.
- `DELETE /api/resumes/:resumeId` — delete a resume and every saved analysis linked to it.

The deterministic checks work without an AI key. Add a free Gemini key to `GEMINI_API_KEY` to enable the schema-validated profile and writing-clarity assessment. If Gemini is unavailable, analysis completes with a clear `aiStatus` fallback rather than exposing resume content or failing the user flow.

Job match combines deterministic keyword overlap with Gemini semantic judgment. Results identify matched skills, missing skills, and a priority for each gap.

## Security and usage controls

- CORS permits only `CLIENT_ORIGIN` plus optional comma-separated `CLIENT_ORIGINS`.
- API requests are limited to 100 per 15 minutes per client; AI analysis is limited to 10 per hour per client and 20 per user per day by default.
- Request logs contain only the method, route path, status, and duration—never resume text, job descriptions, filenames, tokens, headers, or user identifiers.
- AI requests timeout after 20 seconds and retry once. Model output is validated before use.

## Deployment target

Deploy `client` to Vercel and `server` to Render or Railway. Set `CLIENT_ORIGIN` to the Vercel domain and `VITE_API_URL` to the deployed server's `/api` URL.

### Render + Vercel configuration

On Render, set `NODE_ENV=production`, set `CLIENT_ORIGIN` to the exact Vercel deployment origin (for example `https://your-app.vercel.app`), and use `npm start` as the start command. Do not include a path or rely on a development `.env` file.

On Vercel, set `VITE_API_URL` to `https://your-render-service.onrender.com/api`, then redeploy the frontend. A Vite environment variable is compiled into the client at build time.
