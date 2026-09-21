import mongoose from 'mongoose';
import config from './env.js';

let memoryServer = null;

async function connectDB() {
  // Disable command buffering when not connected so queries fail fast to cache
  mongoose.set('bufferCommands', false);
  try {
    let uri = config.mongoUri;

    // Use in-memory MongoDB only if explicitly requested; otherwise use in-memory cache
    if (!uri) {
      if (process.env.USE_IN_MEMORY_DB === 'true') {
        console.log('⚡ Starting in-memory MongoDB (USE_IN_MEMORY_DB=true)...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        uri = memoryServer.getUri();
        console.log(`✅ In-memory MongoDB started at ${uri}`);
      } else {
        console.log('⚡ No MONGODB_URI configured. Running with in-memory cache service (fast start).');
        return null;
      }
    }

    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    // Don't crash the server - allow it to run without DB
    return null;
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
      memoryServer = null;
    }
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error.message);
  }
}

export { connectDB, disconnectDB };
