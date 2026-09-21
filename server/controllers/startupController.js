import startupService from '../services/startupService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const startupController = {
  getByCountry: asyncHandler(async (req, res) => {
    const { sector, page, limit } = req.query;
    const result = await startupService.getStartupsByCountry(
      req.params.code,
      req.query.countryName,
      { sector, page: parseInt(page) || 1, limit: parseInt(limit) || 20 }
    );
    res.json({ success: true, ...result });
  }),

  getGlobal: asyncHandler(async (req, res) => {
    const { sector, limit } = req.query;
    const result = await startupService.getGlobalStartups({
      sector, limit: parseInt(limit) || 20,
    });
    res.json({ success: true, ...result });
  }),

  getSectors: asyncHandler(async (_req, res) => {
    res.json({ success: true, data: startupService.getSectors() });
  }),
};

export default startupController;
