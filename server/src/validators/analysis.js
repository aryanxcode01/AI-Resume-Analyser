import { z } from 'zod';

export const createAnalysisSchema = z.object({
  resumeId: z.string().regex(/^[a-f\d]{24}$/i, 'Choose a valid resume.'),
  jobDescription: z
    .string()
    .trim()
    .min(100, 'Add a job description with at least 100 characters.')
    .max(20_000)
    .optional(),
});
