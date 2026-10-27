import { Router } from 'express';
import {
  createAnalysis,
  deleteAnalysis,
  getAnalysis,
  listAnalyses,
} from '../controllers/analysis-controller.js';
import { requireAuth } from '../middleware/require-auth.js';
import { analysisLimiter, enforceDailyAnalysisLimit } from '../middleware/rate-limits.js';

export const analysisRouter = Router();
analysisRouter.post('/', requireAuth, analysisLimiter, enforceDailyAnalysisLimit, createAnalysis);
analysisRouter.get('/', requireAuth, listAnalyses);
analysisRouter.get('/:analysisId', requireAuth, getAnalysis);
analysisRouter.delete('/:analysisId', requireAuth, deleteAnalysis);
