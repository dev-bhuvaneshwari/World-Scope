import Cache from '../models/Cache.js';

// In-memory cache for when MongoDB is unavailable
const memoryCache = new Map();

const cacheService = {
  async get(key) {
    try {
      // Try in-memory first
      const memItem = memoryCache.get(key);
      if (memItem && memItem.expiresAt > new Date()) {
        return memItem.data;
      }
      if (memItem) memoryCache.delete(key);

      // Try MongoDB
      const cached = await Cache.findOne({ key, expiresAt: { $gt: new Date() } });
      if (cached) {
        // Populate memory cache
        memoryCache.set(key, { data: cached.data, expiresAt: cached.expiresAt });
        return cached.data;
      }
      return null;
    } catch {
      // If DB fails, just use memory cache
      const memItem = memoryCache.get(key);
      return (memItem && memItem.expiresAt > new Date()) ? memItem.data : null;
    }
  },

  async set(key, data, ttlMs) {
    const expiresAt = new Date(Date.now() + ttlMs);
    
    // Always set in memory
    memoryCache.set(key, { data, expiresAt });

    // Try to persist to MongoDB
    try {
      await Cache.findOneAndUpdate(
        { key },
        { key, data, expiresAt, createdAt: new Date() },
        { upsert: true, new: true }
      );
    } catch {
      // Memory cache is fine as fallback
    }
  },

  async invalidate(key) {
    memoryCache.delete(key);
    try {
      await Cache.deleteOne({ key });
    } catch {
      // Ignore DB errors
    }
  },

  async invalidatePattern(pattern) {
    // Clear matching memory cache entries
    for (const key of memoryCache.keys()) {
      if (key.includes(pattern)) memoryCache.delete(key);
    }
    try {
      await Cache.deleteMany({ key: { $regex: pattern } });
    } catch {
      // Ignore DB errors
    }
  },

  clearMemory() {
    memoryCache.clear();
  },
};

export default cacheService;
