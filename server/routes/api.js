import { Router } from 'express';
import countryController from '../controllers/countryController.js';
import newsController from '../controllers/newsController.js';
import technologyController from '../controllers/technologyController.js';
import startupController from '../controllers/startupController.js';
import researchController from '../controllers/researchController.js';
import aiController from '../controllers/aiController.js';
import searchController from '../controllers/searchController.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// ── Countries ─────────────────────────────────
router.get('/countries', countryController.getAll);
router.get('/countries/stats', countryController.getStats);
router.get('/countries/regions', countryController.getRegions);
router.get('/countries/compare', countryController.compare);
router.get('/countries/:code', countryController.getByCode);
router.get('/countries/:code/indicators', countryController.getIndicators);

// ── News ──────────────────────────────────────
router.get('/news', newsController.getGlobal);
router.get('/news/categories', newsController.getCategories);
router.get('/news/:code', newsController.getByCountry);

// ── Technology ────────────────────────────────
router.get('/technology', technologyController.getGlobal);
router.get('/technology/categories', technologyController.getCategories);
router.get('/technology/:code', technologyController.getByCountry);

// ── Startups ──────────────────────────────────
router.get('/startups', startupController.getGlobal);
router.get('/startups/sectors', startupController.getSectors);
router.get('/startups/:code', startupController.getByCountry);

// ── Research ──────────────────────────────────
router.get('/research', researchController.getGlobal);
router.get('/research/fields', researchController.getFields);
router.get('/research/:code', researchController.getByCountry);

// ── AI Summaries ──────────────────────────────
router.get('/summary/:code', aiLimiter, aiController.getCountrySummary);
router.get('/summary/:code/:type', aiLimiter, aiController.getTopicSummary);

// ── Search ────────────────────────────────────
router.get('/search', searchController.globalSearch);

// ── Health check ──────────────────────────────
router.get('/health', (_req, res) => {
  res.json({ 
    success: true, 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default router;
