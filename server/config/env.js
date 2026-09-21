import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  
  // MongoDB
  mongoUri: process.env.MONGODB_URI || '',
  
  // AI Services (OpenAI, Google Gemini Free, Groq Free)
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
  
  // News APIs
  gnewsApiKey: process.env.GNEWS_API_KEY || '',
  
  // GitHub
  githubToken: process.env.GITHUB_TOKEN || '',
  
  // Demo mode
  demoMode: process.env.DEMO_MODE === 'true' || false,
  
  // API URLs
  restCountriesUrl: process.env.REST_COUNTRIES_URL || 'https://restcountries.com/v3.1',
  worldBankUrl: process.env.WORLD_BANK_URL || 'https://api.worldbank.org/v2',
  gdeltUrl: process.env.GDELT_URL || 'https://api.gdeltproject.org/api/v2/doc/doc',
  crossrefUrl: process.env.CROSSREF_URL || 'https://api.crossref.org',
  
  // Cache durations (milliseconds)
  cache: {
    countryTTL: 24 * 60 * 60 * 1000,       // 24 hours
    newsTTL: 30 * 60 * 1000,                // 30 minutes
    technologyTTL: 2 * 60 * 60 * 1000,      // 2 hours
    researchTTL: 6 * 60 * 60 * 1000,        // 6 hours
    summaryTTL: 12 * 60 * 60 * 1000,        // 12 hours
    worldBankTTL: 7 * 24 * 60 * 60 * 1000,  // 7 days
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,                  // requests per window
  },

  isDev() {
    return this.nodeEnv === 'development';
  },

  hasAI() {
    return !!(this.geminiApiKey || this.groqApiKey || this.openaiApiKey);
  },

  hasOpenAI() {
    return this.hasAI();
  },

  hasMongoDB() {
    return !!this.mongoUri;
  },
};

export default config;
