import mongoose from 'mongoose';

const summarySchema = new mongoose.Schema({
  countryCode: { type: String, required: true, index: true, uppercase: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['country', 'news', 'technology', 'industry', 'startup', 'research'],
    index: true 
  },
  contentHash: { type: String, required: true },
  summary: { type: String, required: true },
  keyDevelopments: [String],
  trends: [String],
  implications: [String],
  generatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: true },
  model: { type: String }, // which AI model generated this
  isDemo: { type: Boolean, default: false },
}, { timestamps: true });

summarySchema.index({ countryCode: 1, type: 1, contentHash: 1 }, { unique: true });

export default mongoose.model('Summary', summarySchema);
