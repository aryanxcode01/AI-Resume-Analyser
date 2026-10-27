import { Resume } from '../models/resume.js';
import { Analysis } from '../models/analysis.js';
import { ApiError } from '../errors/api-error.js';
import { extractResumeText, validateUploadedDocument } from '../services/document-service.js';

export async function createResume(request, response) {
  const document = await validateUploadedDocument(request.file);
  const extractedText = await extractResumeText(request.file.buffer, document.kind);
  const resume = await Resume.create({
    userId: request.userId,
    fileName: request.file.originalname,
    mimeType: document.mimeType,
    extractedText,
  });
  response.status(201).json({
    resumeId: resume.id,
    fileName: resume.fileName,
    extractedTextLength: extractedText.length,
    profile: null,
  });
}

export async function deleteResume(request, response) {
  const resume = await Resume.findOneAndDelete({
    _id: request.params.resumeId,
    userId: request.userId,
  });
  if (!resume) throw new ApiError(404, 'RESUME_NOT_FOUND', 'Resume not found.');
  await Analysis.deleteMany({ resumeId: resume._id, userId: request.userId });
  response.status(204).send();
}
