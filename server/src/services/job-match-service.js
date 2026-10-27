import { jobMatchWeights } from '../config/scoring.js';
import { jobMatchPrompt } from '../../prompts/job-match-v1.js';
import { GeminiProvider } from './ai-provider.js';
import { jobMatchJsonSchema, jobMatchSchema } from './job-match-schema.js';
import { getSkillOverlap } from './skill-keywords.js';

function fallbackMatch(overlap) {
  return {
    semanticScore: overlap.keywordScore,
    matchedSkills: overlap.matchedSkills,
    missingSkills: overlap.missingSkills.map((skill) => ({
      skill,
      priority: 'medium',
      reason: 'This keyword appears in the job description but was not found in the resume.',
    })),
    reasons: ['Job match is based on keyword overlap because semantic analysis is unavailable.'],
  };
}

export async function matchResumeToJob(
  resumeText,
  jobDescription,
  { provider = new GeminiProvider() } = {},
) {
  const overlap = getSkillOverlap(resumeText, jobDescription);
  let semantic = fallbackMatch(overlap);
  let aiStatus = provider.isConfigured ? 'unavailable' : 'not_configured';

  try {
    const result = await provider.generateJson({
      prompt: jobMatchPrompt
        .replace('{{RESUME_TEXT}}', resumeText)
        .replace('{{JOB_DESCRIPTION}}', jobDescription),
      jsonSchema: jobMatchJsonSchema,
      resultSchema: jobMatchSchema,
    });
    if (result) {
      semantic = result;
      aiStatus = 'completed';
    }
  } catch {
    // Never log untrusted resume/JD text or a provider response.
  }

  const jobMatch = Math.round(
    (overlap.keywordScore * jobMatchWeights.keyword +
      semantic.semanticScore * jobMatchWeights.semantic) /
      100,
  );
  const matchedSkills = [...new Set([...overlap.matchedSkills, ...semantic.matchedSkills])];
  const missingByName = new Map(
    semantic.missingSkills.map((skill) => [skill.skill.toLowerCase(), skill]),
  );
  for (const skill of overlap.missingSkills) {
    if (!missingByName.has(skill.toLowerCase())) {
      missingByName.set(skill.toLowerCase(), {
        skill,
        priority: 'medium',
        reason: 'This keyword appears in the job description but was not found in the resume.',
      });
    }
  }

  return {
    jobMatch,
    keywordScore: overlap.keywordScore,
    semanticScore: semantic.semanticScore,
    matchedSkills,
    missingSkills: [...missingByName.values()],
    reasons: semantic.reasons,
    aiStatus,
  };
}
