import multer from 'multer';
import { maxUploadBytes } from '../services/document-service.js';

export const uploadResume = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxUploadBytes, files: 1 },
}).single('resume');
