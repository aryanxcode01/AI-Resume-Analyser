import { z } from 'zod';

const stringList = z.array(z.string().trim().min(1).max(100)).max(50);

export const aiProfileSchema = z.object({
  headline: z.string().trim().max(180).nullable(),
  skills: stringList,
  experienceHighlights: stringList.max(8),
  educationHighlights: stringList.max(6),
  clarityScore: z.number().int().min(0).max(100),
  clarityFeedback: stringList.max(4),
});

export const profileAnalysisJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    headline: { type: ['string', 'null'] },
    skills: { type: 'array', items: { type: 'string' } },
    experienceHighlights: { type: 'array', items: { type: 'string' } },
    educationHighlights: { type: 'array', items: { type: 'string' } },
    clarityScore: { type: 'integer', minimum: 0, maximum: 100 },
    clarityFeedback: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'headline',
    'skills',
    'experienceHighlights',
    'educationHighlights',
    'clarityScore',
    'clarityFeedback',
  ],
};
