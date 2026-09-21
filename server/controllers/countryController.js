import countryService from '../services/countryService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const countryController = {
  getAll: asyncHandler(async (req, res) => {
    const { region, search } = req.query;

    let countries;
    if (search) {
      countries = await countryService.searchCountries(search);
    } else if (region) {
      countries = await countryService.getCountriesByRegion(region);
    } else {
      countries = await countryService.fetchAllCountries();
    }

    res.json({ success: true, data: countries, total: countries.length });
  }),

  getByCode: asyncHandler(async (req, res) => {
    const country = await countryService.getCountryByCode(req.params.code);
    res.json({ success: true, data: country });
  }),

  getIndicators: asyncHandler(async (req, res) => {
    const indicators = await countryService.getCountryIndicators(req.params.code);
    res.json({ success: true, data: indicators });
  }),

  getRegions: asyncHandler(async (_req, res) => {
    const countries = await countryService.fetchAllCountries();
    const regions = [...new Set(countries.map(c => c.region))].filter(Boolean).sort();
    const regionCounts = regions.map(region => ({
      name: region,
      count: countries.filter(c => c.region === region).length,
    }));
    res.json({ success: true, data: regionCounts });
  }),

  getStats: asyncHandler(async (_req, res) => {
    const countries = await countryService.fetchAllCountries();
    const totalPopulation = countries.reduce((sum, c) => sum + (c.population || 0), 0);
    const regions = [...new Set(countries.map(c => c.region))].filter(Boolean);
    
    res.json({
      success: true,
      data: {
        totalCountries: countries.length,
        totalPopulation,
        regions: regions.length,
        continents: [...new Set(countries.flatMap(c => c.continents || []))].length,
      },
    });
  }),

  compare: asyncHandler(async (req, res) => {
    const codes = (req.query.codes || '').split(',').filter(Boolean).slice(0, 5);
    if (codes.length < 2) {
      return res.status(400).json({ success: false, error: 'Provide at least 2 country codes separated by commas' });
    }

    const countries = await Promise.all(
      codes.map(async (code) => {
        const country = await countryService.getCountryByCode(code.trim());
        const indicators = await countryService.getCountryIndicators(code.trim());
        return { ...country, indicators };
      })
    );

    res.json({ success: true, data: countries });
  }),
};

export default countryController;
