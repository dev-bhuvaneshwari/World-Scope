import newsService from '../services/newsService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const newsController = {
  getByCountry: asyncHandler(async (req, res) => {
    const { category, page, limit } = req.query;
    const result = await newsService.getNewsByCountry(
      req.params.code,
      req.query.countryName,
      { category, page: parseInt(page) || 1, limit: parseInt(limit) || 20 }
    );
    res.json({ success: true, ...result });
  }),

  getGlobal: asyncHandler(async (req, res) => {
    const { category, page, limit } = req.query;
    const result = await newsService.getGlobalNews({
      category, page: parseInt(page) || 1, limit: parseInt(limit) || 20,
    });
    res.json({ success: true, ...result });
  }),

  getCategories: asyncHandler(async (_req, res) => {
    res.json({ success: true, data: newsService.getCategories() });
  }),
};

export default newsController;
