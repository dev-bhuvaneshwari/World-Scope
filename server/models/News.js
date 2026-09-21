import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  source: { type: String },
  sourceUrl: { type: String },
  url: { type: String, required: true },
  imageUrl: { type: String },
  publishedAt: { type: Date, index: true },
  countryCode: { type: String, index: true, uppercase: true },
  countryName: { type: String },
  category: { 
    type: String, 
    index: true,
    enum: ['politics', 'economy', 'technology', 'science', 'business', 'startups', 'education', 'health', 'environment', 'general'],
    default: 'general'
  },
  language: { type: String, default: 'en' },
  fetchedAt: { type: Date, default: Date.now },
}, { timestamps: true });

newsSchema.index({ url: 1 }, { unique: true, sparse: true });
newsSchema.index({ countryCode: 1, publishedAt: -1 });
newsSchema.index({ category: 1, publishedAt: -1 });
newsSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('News', newsSchema);
