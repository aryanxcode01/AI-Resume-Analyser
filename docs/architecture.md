# Architecture

## Pipeline

`Upload -> Validate -> Extract -> Normalize -> Profile -> Analyze -> Compare`

The pipeline will be added in phases. Resume and job-description text are treated as untrusted data and are never emitted by application logs.

## Application boundaries

- `client`: a React application that owns screens, accessible feedback, and API calls.
- `server`: an Express API that owns validation, persistence, scoring, and AI-provider calls.
- `server/prompts`: versioned AI instructions added in Phase 2.

## Score policy

Results are labelled as **estimated ATS readiness**. Each visual score must also include a text state (Good, Average, or Low); colour is never the only signal.
