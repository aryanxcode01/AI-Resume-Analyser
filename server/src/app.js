import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { databaseStatus } from './config/database.js';
import { env } from './config/env.js';
import { ApiError } from './errors/api-error.js';
import { apiLimiter } from './middleware/rate-limits.js';
import { requestLogger } from './middleware/request-logger.js';
import { analysisRouter } from './routes/analysis-routes.js';
import { authRouter } from './routes/auth-routes.js';
import { resumeRouter } from './routes/resume-routes.js';

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', env.trustProxy);
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.clientOrigins.includes(origin)) return callback(null, true);
      return callback(
        new ApiError(403, 'ORIGIN_NOT_ALLOWED', 'This browser origin is not allowed.'),
      );
    },
  }),
);
app.use(express.json({ limit: '100kb' }));
app.use(requestLogger);

export function healthCheck(_request, response) {
  response.status(200).json({
    status: 'ok',
    service: 'ai-resume-analyzer-api',
    database: databaseStatus(),
  });
}

app.get('/health', healthCheck);
app.use('/api', apiLimiter);
app.use('/api/auth', authRouter);
app.use('/api/resumes', resumeRouter);
app.use('/api/analyses', analysisRouter);

app.use((_request, response) => {
  response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } });
});

app.use((error, _request, response, _next) => {
  if (error.name === 'MulterError' && error.code === 'LIMIT_FILE_SIZE') {
    return response.status(413).json({
      error: { code: 'FILE_TOO_LARGE', message: 'Resume files must be 5 MB or smaller.' },
    });
  }

  if (error instanceof ApiError) {
    return response.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
      },
    });
  }

  if (error.name === 'ZodError') {
    return response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: error.issues?.[0]?.message ?? 'Check the information and try again.',
      },
    });
  }

  console.error('Unhandled API error:', error.name);
  return response
    .status(500)
    .json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' } });
});
