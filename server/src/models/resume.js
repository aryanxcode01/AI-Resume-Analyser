import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fileName: { type: String, required: true, maxlength: 255 },
    mimeType: { type: String, required: true },
    extractedText: { type: String, required: true },
    profile: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

export const Resume = mongoose.model('Resume', resumeSchema);
