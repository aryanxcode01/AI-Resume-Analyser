import { promptVersion } from '../config/scoring.js';
import { profileAnalysisPrompt } from '../../prompts/profile-analysis-v1.js';
import { GeminiProvider } from './ai-provider.js';
import { scoreAtsReadiness } from './ats-scorer.js';
import { detectContacts, extractListedSkills, parseSections } from './section-parser.js';
import { aiProfileSchema, profileAnalysisJsonSchema } from './profile-schema.js';

function fallbackAiProfile(sections) {
  return {
    headline: sections.summary.split('\n')[0] || null,
    skills: extractListedSkills(sections.skills),
    experienceHighlights: sections.experience.split('\n').filter(Boolean).slice(0, 5),
    educationHighlights: sections.education.split('\n').filter(Boolean).slice(0, 3),
    clarityScore: 50,
    clarityFeedback: [
      'Writing clarity could not be assessed because the AI provider is unavailable.',
    ],
  };
}

function recommendationsFrom(breakdown, aiProfile) {
  const recommendations = breakdown.filter((item) => !item.passed).map((item) => item.message);
  return [...recommendations, ...aiProfile.clarityFeedback].slice(0, 6);
}

export async function analyzeResumeText(text, { provider = new GeminiProvider() } = {}) {
  const sections = parseSections(text);
  let aiProfile = fallbackAiProfile(sections);
  let aiStatus = provider.isConfigured ? 'unavailable' : 'not_configured';

  try {
    const result = await provider.generateJson({
      prompt: profileAnalysisPrompt.replace('{{RESUME_TEXT}}', text),
      jsonSchema: profileAnalysisJsonSchema,
      resultSchema: aiProfileSchema,
    });
    if (result) {
      aiProfile = result;
      aiStatus = 'completed';
    }
  } catch {
    // Deliberately do not log resume-related prompt content or provider responses.
  }

  const profile = {
    contact: detectContacts(text),
    sections: Object.fromEntries(
      Object.entries(sections).map(([name, content]) => [name, Boolean(content)]),
    ),
    ...aiProfile,
  };
  const scored = scoreAtsReadiness({
    text,
    sections,
    profile,
    clarityScore: aiProfile.clarityScore,
  });

  return {
    scores: { overall: scored.atsScore, ats: scored.atsScore, jobMatch: null },
    breakdown: scored.breakdown,
    metrics: scored.metrics,
    profile,
    recommendations: recommendationsFrom(scored.breakdown, aiProfile),
    promptVersion,
    aiStatus,
  };
}
