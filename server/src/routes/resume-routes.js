import { Router } from 'express';
import { createResume, deleteResume } from '../controllers/resume-controller.js';
import { requireAuth } from '../middleware/require-auth.js';
import { uploadResume } from '../middleware/upload.js';

export const resumeRouter = Router();
resumeRouter.post('/', requireAuth, uploadResume, createResume);
resumeRouter.delete('/:resumeId', requireAuth, deleteResume);
