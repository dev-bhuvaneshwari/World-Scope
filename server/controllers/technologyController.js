import technologyService from '../services/technologyService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const technologyController = {
  getByCountry: asyncHandler(async (req, res) => {
    const { category, page, limit } = req.query;
    const result = await technologyService.getTechByCountry(
      req.params.code,
      req.query.countryName,
      { category, page: parseInt(page) || 1, limit: parseInt(limit) || 20 }
    );
    res.json({ success: true, ...result });
  }),

  getGlobal: asyncHandler(async (req, res) => {
    const { category, limit } = req.query;
    const result = await technologyService.getGlobalTrends({
      category, limit: parseInt(limit) || 30,
    });
    res.json({ success: true, ...result });
  }),

  getCategories: asyncHandler(async (_req, res) => {
    res.json({ 
      success: true, 
      data: technologyService.getCategories(),
      labels: technologyService.getCategoryLabels(),
    });
  }),
};

export default technologyController;
