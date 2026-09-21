import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config/env.js';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/api.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// ── Security ──────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Allow frontend assets
  crossOriginEmbedderPolicy: false,
}));

// ── CORS ──────────────────────────────────────
app.use(cors({
  origin: config.isDev()
    ? ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']
    : (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true),
  credentials: true,
}));


// ── Body parsing ──────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Compression ───────────────────────────────
app.use(compression());

// ── Logging ───────────────────────────────────
if (config.isDev()) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── Rate limiting ─────────────────────────────
app.use('/api', apiLimiter);

// ── API Routes ────────────────────────────────
app.use('/api', apiRoutes);

// ── Serve frontend in production ──────────────
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next();
  });
});

// ── Error handling ────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start server ──────────────────────────────
async function start() {
  console.log('\n🌍 WorldScope Server Starting...\n');

  // Connect to MongoDB
  const dbConnection = await connectDB();
  if (!dbConnection) {
    console.warn('⚠️  Running without database — using in-memory cache only');
  }

  // Check API keys
  console.log(`📰 News source: GDELT (free, no key needed)`);
  if (config.gnewsApiKey) console.log('📰 GNews API: ✅ configured');
  if (config.geminiApiKey) {
    console.log('🤖 AI Provider: ✅ Google Gemini (Free tier active)');
  } else if (config.groqApiKey) {
    console.log('🤖 AI Provider: ✅ Groq (Free tier active)');
  } else if (config.openaiApiKey) {
    console.log('🤖 AI Provider: ✅ OpenAI configured');
  } else {
    console.log('🤖 AI Provider: ❌ not configured (using built-in extractive fallback)');
  }
  if (config.githubToken) {
    console.log('🐙 GitHub API: ✅ authenticated (5000 req/hr)');
  } else {
    console.log('🐙 GitHub API: unauthenticated (60 req/hr)');
  }
  if (config.demoMode) {
    console.log('🎭 Demo mode: ENABLED');
  }

  app.listen(config.port, () => {
    console.log(`\n🚀 Server running at http://localhost:${config.port}`);
    console.log(`📡 API available at http://localhost:${config.port}/api\n`);
  });
}

start().catch(console.error);

export default app;
