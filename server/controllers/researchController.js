import researchService from '../services/researchService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const researchController = {
  getByCountry: asyncHandler(async (req, res) => {
    const { field, page, limit } = req.query;
    const result = await researchService.getResearchByCountry(
      req.params.code,
      req.query.countryName,
      { field, page: parseInt(page) || 1, limit: parseInt(limit) || 20 }
    );
    res.json({ success: true, ...result });
  }),

  getGlobal: asyncHandler(async (req, res) => {
    const { field, page, limit } = req.query;
    const result = await researchService.getGlobalResearch({
      field, page: parseInt(page) || 1, limit: parseInt(limit) || 20,
    });
    res.json({ success: true, ...result });
  }),

  getFields: asyncHandler(async (_req, res) => {
    res.json({ success: true, data: researchService.getFields() });
  }),
};

export default researchController;
