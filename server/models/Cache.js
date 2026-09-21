import mongoose from 'mongoose';

const cacheSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Cache', cacheSchema);
