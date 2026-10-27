import { config as loadEnv } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

loadEnv({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env') });

const nodeEnv = process.env.NODE_ENV ?? 'development';
function normalizeOrigin(origin) {
  try {
    return new URL(origin).origin;
  } catch {
    return origin.replace(/\/+$/, '');
  }
}

const primaryClientOrigin = normalizeOrigin(process.env.CLIENT_ORIGIN ?? 'http://localhost:5173');
const extraClientOrigins = (process.env.CLIENT_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  clientOrigin: primaryClientOrigin,
  clientOrigins: [...new Set([primaryClientOrigin, ...extraClientOrigins.map(normalizeOrigin)])],
  dailyAnalysisLimit: Number(process.env.DAILY_ANALYSIS_LIMIT ?? 20),
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
  jwtSecret:
    process.env.JWT_SECRET ??
    (nodeEnv === 'production' ? '' : 'development-only-secret-change-before-production'),
  mongoUri: process.env.MONGODB_URI,
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  trustProxy: nodeEnv === 'production' ? 1 : false,
};
