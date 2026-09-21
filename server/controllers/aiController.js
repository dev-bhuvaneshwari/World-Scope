import aiService from '../services/aiService.js';
import newsService from '../services/newsService.js';
import technologyService from '../services/technologyService.js';
import startupService from '../services/startupService.js';
import researchService from '../services/researchService.js';
import config from '../config/env.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const aiController = {
  getCountrySummary: asyncHandler(async (req, res) => {
    const { code } = req.params;
    const countryName = req.query.countryName || code;

    // Gather source data
    const [newsResult, techResult, startupResult, researchResult] = await Promise.allSettled([
      newsService.getNewsByCountry(code, countryName, { limit: 10 }),
      technologyService.getTechByCountry(code, countryName, { limit: 10 }),
      startupService.getStartupsByCountry(code, countryName, { limit: 5 }),
      researchService.getResearchByCountry(code, countryName, { limit: 5 }),
    ]);

    const sourceData = {
      news: newsResult.status === 'fulfilled' ? newsResult.value.articles?.slice(0, 10) : [],
      technologies: techResult.status === 'fulfilled' ? techResult.value.trends?.slice(0, 10) : [],
      startups: startupResult.status === 'fulfilled' ? startupResult.value.startups?.slice(0, 5) : [],
      research: researchResult.status === 'fulfilled' ? researchResult.value.papers?.slice(0, 5) : [],
    };

    const summary = await aiService.generateCountrySummary(code, countryName, sourceData);

    res.json({
      success: true,
      data: summary,
      aiEnabled: config.hasOpenAI(),
    });
  }),

  getTopicSummary: asyncHandler(async (req, res) => {
    const { code, type } = req.params;
    const countryName = req.query.countryName || code;

    let sourceData;
    switch (type) {
      case 'news': {
        const result = await newsService.getNewsByCountry(code, countryName, { limit: 15 });
        sourceData = result.articles || [];
        break;
      }
      case 'technology': {
        const result = await technologyService.getTechByCountry(code, countryName, { limit: 15 });
        sourceData = result.trends || [];
        break;
      }
      case 'startup': {
        const result = await startupService.getStartupsByCountry(code, countryName, { limit: 10 });
        sourceData = result.startups || [];
        break;
      }
      case 'research': {
        const result = await researchService.getResearchByCountry(code, countryName, { limit: 10 });
        sourceData = result.papers || [];
        break;
      }
      default:
        return res.status(400).json({ success: false, error: 'Invalid summary type' });
    }

    const summary = await aiService.generateTopicSummary(code, countryName, type, sourceData);

    res.json({
      success: true,
      data: summary,
      aiEnabled: config.hasOpenAI(),
    });
  }),
};

export default aiController;
