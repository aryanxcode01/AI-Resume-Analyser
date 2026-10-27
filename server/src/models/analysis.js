import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },
    jdText: { type: String, default: null },
    scores: { type: mongoose.Schema.Types.Mixed, required: true },
    breakdown: { type: [mongoose.Schema.Types.Mixed], required: true },
    profile: { type: mongoose.Schema.Types.Mixed, required: true },
    skillGap: { type: mongoose.Schema.Types.Mixed, default: null },
    recommendations: { type: [String], default: [] },
    promptVersion: { type: String, required: true },
  },
  { timestamps: true },
);

export const Analysis = mongoose.model('Analysis', analysisSchema);
