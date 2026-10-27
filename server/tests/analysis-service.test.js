import { describe, expect, it, vi } from 'vitest';
import { analyzeResumeText } from '../src/services/analysis-service.js';
import { GeminiProvider } from '../src/services/ai-provider.js';
import { scoreAtsReadiness } from '../src/services/ats-scorer.js';
import { detectContacts, parseSections } from '../src/services/section-parser.js';
import { aiProfileSchema, profileAnalysisJsonSchema } from '../src/services/profile-schema.js';

const resumeText = `Jane Candidate
jane@example.com | +1 555 555 5555 | https://linkedin.com/in/jane

Professional Summary
Software engineer with experience delivering accessible web applications.

Skills
JavaScript, React, Node.js, MongoDB, Testing

Experience
Software Engineer | Example Co
- Built a resilient API for job applications.
- Improved page performance by 30%.
- Partnered with design on accessible experiences.
- Reviewed pull requests and coached teammates.

Education
Bachelor of Technology in Computer Science
`.repeat(8);

describe('section parser', () => {
  it('recognizes standard headings and contact data', () => {
    const sections = parseSections(resumeText);
    expect(sections.summary).toContain('Software engineer');
    expect(sections.skills).toContain('React');
    expect(detectContacts(resumeText)).toMatchObject({ email: 'jane@example.com' });
  });
});

describe('ATS scorer', () => {
  it('returns an explainable, bounded deterministic score', () => {
    const sections = parseSections(resumeText);
    const profile = { contact: detectContacts(resumeText) };
    const result = scoreAtsReadiness({ text: resumeText, sections, profile, clarityScore: 80 });
    expect(result.atsScore).toBeGreaterThanOrEqual(0);
    expect(result.atsScore).toBeLessThanOrEqual(100);
    expect(result.breakdown).toHaveLength(7);
    expect(result.breakdown.find((item) => item.id === 'contact')).toMatchObject({ passed: true });
  });
});

describe('Gemini provider', () => {
  it('retries once after invalid model JSON, then parses with Zod', async () => {
    const validProfile = {
      headline: 'Software Engineer',
      skills: ['React'],
      experienceHighlights: ['Built web apps'],
      educationHighlights: ['BTech'],
      clarityScore: 82,
      clarityFeedback: ['Use more measurable outcomes.'],
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: '{' }] } }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify(validProfile) }] } }],
        }),
      });
    const provider = new GeminiProvider({ apiKey: 'test-key', fetchImpl });

    await expect(
      provider.generateJson({
        prompt: 'resume data',
        jsonSchema: profileAnalysisJsonSchema,
        resultSchema: aiProfileSchema,
      }),
    ).resolves.toEqual(validProfile);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

describe('analysis service', () => {
  it('finishes deterministically without a configured AI key', async () => {
    const provider = { isConfigured: false, generateJson: vi.fn().mockResolvedValue(null) };
    const result = await analyzeResumeText(resumeText, { provider });

    expect(result.aiStatus).toBe('not_configured');
    expect(result.scores.ats).toBe(result.scores.overall);
    expect(result.scores.ats).toBeGreaterThan(0);
    expect(result.promptVersion).toBe('profile-analysis-v1');
  });
});
