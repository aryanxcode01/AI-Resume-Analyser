import { Analysis } from '../models/analysis.js';
import { Resume } from '../models/resume.js';
import { analyzeResumeText } from '../services/analysis-service.js';
import { GeminiProvider } from '../services/ai-provider.js';
import { matchResumeToJob } from '../services/job-match-service.js';
import { createAnalysisSchema } from '../validators/analysis.js';
import { ApiError } from '../errors/api-error.js';

export async function createAnalysis(request, response) {
  const { resumeId, jobDescription } = createAnalysisSchema.parse(request.body);
  const resume = await Resume.findOne({ _id: resumeId, userId: request.userId });
  if (!resume) throw new ApiError(404, 'RESUME_NOT_FOUND', 'Resume not found.');

  const provider = new GeminiProvider();
  const result = await analyzeResumeText(resume.extractedText, { provider });
  const jobMatch = jobDescription
    ? await matchResumeToJob(resume.extractedText, jobDescription, { provider })
    : null;
  const scores = {
    ...result.scores,
    jobMatch: jobMatch?.jobMatch ?? null,
    overall: jobMatch
      ? Math.round(result.scores.ats * 0.6 + jobMatch.jobMatch * 0.4)
      : result.scores.ats,
  };
  const skillGap = jobMatch
    ? {
        keywordScore: jobMatch.keywordScore,
        semanticScore: jobMatch.semanticScore,
        matchedSkills: jobMatch.matchedSkills,
        missingSkills: jobMatch.missingSkills,
        reasons: jobMatch.reasons,
        aiStatus: jobMatch.aiStatus,
      }
    : null;

  resume.profile = result.profile;
  await resume.save();
  const analysis = await Analysis.create({
    userId: request.userId,
    resumeId: resume.id,
    jdText: jobDescription ?? null,
    scores,
    breakdown: result.breakdown,
    profile: result.profile,
    skillGap,
    recommendations: result.recommendations,
    promptVersion: jobMatch ? `${result.promptVersion}+job-match-v1` : result.promptVersion,
  });

  response.status(201).json({
    analysisId: analysis.id,
    ...result,
    scores,
    skillGap,
    jobMatchAiStatus: jobMatch?.aiStatus ?? null,
  });
}

function presentAnalysis(analysis) {
  return {
    analysisId: analysis.id,
    resumeId: analysis.resumeId,
    scores: analysis.scores,
    breakdown: analysis.breakdown,
    profile: analysis.profile,
    skillGap: analysis.skillGap,
    recommendations: analysis.recommendations,
    promptVersion: analysis.promptVersion,
    createdAt: analysis.createdAt,
  };
}

export async function listAnalyses(request, response) {
  const analyses = await Analysis.find({ userId: request.userId })
    .sort({ createdAt: -1 })
    .limit(20);
  response.json({ analyses: analyses.map(presentAnalysis) });
}

export async function getAnalysis(request, response) {
  const analysis = await Analysis.findOne({
    _id: request.params.analysisId,
    userId: request.userId,
  });
  if (!analysis) throw new ApiError(404, 'ANALYSIS_NOT_FOUND', 'Analysis not found.');
  response.json(presentAnalysis(analysis));
}

export async function deleteAnalysis(request, response) {
  const analysis = await Analysis.findOneAndDelete({
    _id: request.params.analysisId,
    userId: request.userId,
  });
  if (!analysis) throw new ApiError(404, 'ANALYSIS_NOT_FOUND', 'Analysis not found.');
  response.status(204).send();
}
