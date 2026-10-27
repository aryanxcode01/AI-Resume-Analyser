import { z } from 'zod';

export const jobMatchSchema = z.object({
  semanticScore: z.number().int().min(0).max(100),
  matchedSkills: z.array(z.string().trim().min(1).max(100)).max(50),
  missingSkills: z
    .array(
      z.object({
        skill: z.string().trim().min(1).max(100),
        priority: z.enum(['high', 'medium', 'low']),
        reason: z.string().trim().min(1).max(240),
      }),
    )
    .max(30),
  reasons: z.array(z.string().trim().min(1).max(240)).max(5),
});

export const jobMatchJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    semanticScore: { type: 'integer', minimum: 0, maximum: 100 },
    matchedSkills: { type: 'array', items: { type: 'string' } },
    missingSkills: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          skill: { type: 'string' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          reason: { type: 'string' },
        },
        required: ['skill', 'priority', 'reason'],
      },
    },
    reasons: { type: 'array', items: { type: 'string' } },
  },
  required: ['semanticScore', 'matchedSkills', 'missingSkills', 'reasons'],
};
