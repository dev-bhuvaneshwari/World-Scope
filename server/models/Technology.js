import mongoose from 'mongoose';

const technologySchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { 
    type: String, 
    index: true,
    enum: ['ai', 'cloud', 'cybersecurity', 'robotics', 'semiconductors', 'web', 'mobile', 'quantum', 'biotech', 'renewable-energy', 'space', 'fintech', 'blockchain', 'iot', 'other'],
    default: 'other'
  },
  description: { type: String },
  source: { type: String },
  url: { type: String },
  countryCode: { type: String, index: true, uppercase: true },
  countryName: { type: String },
  relatedNews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'News' }],
  trendScore: { type: Number, default: 0 },
  publishedAt: { type: Date },
  fetchedAt: { type: Date, default: Date.now },
}, { timestamps: true });

technologySchema.index({ category: 1, countryCode: 1 });
technologySchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Technology', technologySchema);
