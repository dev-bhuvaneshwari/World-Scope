import mongoose from 'mongoose';

const researchSchema = new mongoose.Schema({
  title: { type: String, required: true },
  authors: [String],
  institution: { type: String },
  countryCode: { type: String, index: true, uppercase: true },
  countryName: { type: String },
  field: { type: String, index: true },
  abstract: { type: String },
  doi: { type: String },
  url: { type: String },
  journal: { type: String },
  publishedAt: { type: Date, index: true },
  fetchedAt: { type: Date, default: Date.now },
}, { timestamps: true });

researchSchema.index({ countryCode: 1, field: 1, publishedAt: -1 });
researchSchema.index({ title: 'text', abstract: 'text' });

export default mongoose.model('Research', researchSchema);
