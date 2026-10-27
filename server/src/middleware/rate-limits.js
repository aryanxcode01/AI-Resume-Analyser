import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { ApiError } from '../errors/api-error.js';
import { Analysis } from '../models/analysis.js';

const standardOptions = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
  },
};

export const apiLimiter = rateLimit({
  ...standardOptions,
  windowMs: 15 * 60 * 1000,
  limit: 100,
});

export const analysisLimiter = rateLimit({
  ...standardOptions,
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: {
    error: { code: 'ANALYSIS_RATE_LIMITED', message: 'Try another analysis in about an hour.' },
  },
});

export async function enforceDailyAnalysisLimit(request, _response, next) {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await Analysis.countDocuments({
      userId: request.userId,
      createdAt: { $gte: since },
    });
    if (count >= env.dailyAnalysisLimit) {
      return next(
        new ApiError(
          429,
          'DAILY_ANALYSIS_LIMIT_REACHED',
          `You can run up to ${env.dailyAnalysisLimit} analyses per day. Try again tomorrow.`,
        ),
      );
    }
    return next();
  } catch (error) {
    return next(error);
  }
}
