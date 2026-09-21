import mongoose from 'mongoose';

const startupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  sector: { type: String, index: true },
  countryCode: { type: String, index: true, uppercase: true },
  countryName: { type: String },
  foundedYear: { type: Number },
  funding: { type: String },
  source: { type: String },
  url: { type: String },
  activity: { type: String },
  publishedAt: { type: Date },
  fetchedAt: { type: Date, default: Date.now },
}, { timestamps: true });

startupSchema.index({ countryCode: 1, sector: 1 });
startupSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Startup', startupSchema);
