import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api` 
  : '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Network error';
    console.error('API Error:', message);
    return Promise.reject({ message, status: error.response?.status });
  }
);

// ── Countries ─────────────────────────────────
export const fetchCountries = (params) => api.get('/countries', { params });
export const fetchCountry = (code) => api.get(`/countries/${code}`);
export const fetchCountryIndicators = (code) => api.get(`/countries/${code}/indicators`);
export const fetchCountryStats = () => api.get('/countries/stats');
export const fetchRegions = () => api.get('/countries/regions');
export const compareCountries = (codes) => api.get('/countries/compare', { params: { codes: codes.join(',') } });

// ── News ──────────────────────────────────────
export const fetchGlobalNews = (params) => api.get('/news', { params });
export const fetchCountryNews = (code, params) => api.get(`/news/${code}`, { params });
export const fetchNewsCategories = () => api.get('/news/categories');

// ── Technology ────────────────────────────────
export const fetchGlobalTech = (params) => api.get('/technology', { params });
export const fetchCountryTech = (code, params) => api.get(`/technology/${code}`, { params });
export const fetchTechCategories = () => api.get('/technology/categories');

// ── Startups ──────────────────────────────────
export const fetchGlobalStartups = (params) => api.get('/startups', { params });
export const fetchCountryStartups = (code, params) => api.get(`/startups/${code}`, { params });
export const fetchStartupSectors = () => api.get('/startups/sectors');

// ── Research ──────────────────────────────────
export const fetchGlobalResearch = (params) => api.get('/research', { params });
export const fetchCountryResearch = (code, params) => api.get(`/research/${code}`, { params });
export const fetchResearchFields = () => api.get('/research/fields');

// ── AI Summaries ──────────────────────────────
export const fetchCountrySummary = (code, countryName) => 
  api.get(`/summary/${code}`, { params: { countryName }, timeout: 30000 });
export const fetchTopicSummary = (code, type, countryName) => 
  api.get(`/summary/${code}/${type}`, { params: { countryName }, timeout: 30000 });

// ── Search ────────────────────────────────────
export const globalSearch = (q, type) => api.get('/search', { params: { q, type } });

// ── Health ────────────────────────────────────
export const healthCheck = () => api.get('/health');

export default api;
