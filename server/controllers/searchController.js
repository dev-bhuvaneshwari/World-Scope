import countryService from '../services/countryService.js';
import newsService from '../services/newsService.js';
import technologyService from '../services/technologyService.js';
import researchService from '../services/researchService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const searchController = {
  globalSearch: asyncHandler(async (req, res) => {
    const { q, type } = req.query;
    if (!q || q.length < 1) {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }

    const results = { countries: [], news: [], technologies: [], research: [] };

    const fetches = [];

    if (!type || type === 'countries') {
      fetches.push(
        countryService.searchCountries(q)
          .then(data => { results.countries = data.slice(0, 10); })
          .catch(() => {})
      );
    }

    if (!type || type === 'news') {
      fetches.push(
        newsService.getGlobalNews({ category: null, limit: 10 })
          .then(data => {
            results.news = (data.articles || [])
              .filter(a => a.title?.toLowerCase().includes(q.toLowerCase()))
              .slice(0, 10);
          })
          .catch(() => {})
      );
    }

    if (!type || type === 'technologies') {
      fetches.push(
        technologyService.getGlobalTrends({ limit: 20 })
          .then(data => {
            results.technologies = (data.trends || [])
              .filter(t => 
                t.name?.toLowerCase().includes(q.toLowerCase()) ||
                t.description?.toLowerCase().includes(q.toLowerCase())
              )
              .slice(0, 10);
          })
          .catch(() => {})
      );
    }

    if (!type || type === 'research') {
      fetches.push(
        researchService.getGlobalResearch({ field: q, limit: 10 })
          .then(data => { results.research = (data.papers || []).slice(0, 10); })
          .catch(() => {})
      );
    }

    await Promise.allSettled(fetches);

    const total = results.countries.length + results.news.length + 
                  results.technologies.length + results.research.length;

    res.json({ success: true, data: results, total });
  }),
};

export default searchController;
