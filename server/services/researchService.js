import config from '../config/env.js';
import Research from '../models/Research.js';
import cacheService from './cacheService.js';

const FIELDS = [
  'Computer Science', 'Medicine', 'Engineering', 'Physics', 'Biology',
  'Chemistry', 'Economics', 'Mathematics', 'Environmental Science',
  'Materials Science', 'Neuroscience', 'Psychology', 'Social Sciences',
];

const researchService = {
  /**
   * Fetch research papers from Crossref
   */
  async getResearchByCountry(countryCode, countryName, options = {}) {
    const { field, page = 1, limit = 20 } = options;
    const cacheKey = `research:${countryCode}:${field || 'all'}:${page}`;

    const cached = await cacheService.get(cacheKey);
    if (cached && !cached.isDemo) return cached;

    let papers = [];

    // Source: Crossref API
    try {
      papers = await this.fetchFromCrossref(countryName || countryCode, field, page, limit);
    } catch (e) {
      console.warn('Crossref fetch failed:', e.message);
    }

    // Fallback: DB
    if (papers.length === 0) {
      try {
        const query = { countryCode: countryCode.toUpperCase() };
        if (field) query.field = field;
        papers = await Research.find(query).sort({ publishedAt: -1 }).limit(limit).lean();
      } catch { /* ignore */ }
    }

    // Demo fallback
    if (papers.length === 0) {
      papers = this.getDemoResearch(countryCode, countryName);
    }

    const isDemo = papers.length > 0 && papers[0]?.isDemo === true;
    const result = { papers, total: papers.length, page, fields: FIELDS, isDemo };
    if (papers.length > 0) {
      const ttl = isDemo ? 15000 : config.cache.researchTTL;
      await cacheService.set(cacheKey, result, ttl);
      // Persist
      if (!isDemo) {
        this.persistResearch(papers, countryCode).catch(() => {});
      }
    }
    return result;
  },

  /**
   * Global research trends
   */
  async getGlobalResearch(options = {}) {
    const { field, page = 1, limit = 20 } = options;
    const cacheKey = `research:global:${field || 'all'}:${page}`;

    const cached = await cacheService.get(cacheKey);
    if (cached && !cached.isDemo) return cached;

    let papers = [];

    try {
      const queryTerm = field || 'technology innovation';
      papers = await this.fetchFromCrossref(queryTerm, null, page, limit);
    } catch (e) {
      console.warn('Global Crossref fetch failed:', e.message);
    }

    if (papers.length === 0) {
      papers = this.getDemoResearch('', 'Global');
    }

    const isDemo = papers.length > 0 && papers[0]?.isDemo === true;
    const result = { papers, total: papers.length, page, fields: FIELDS, isDemo };
    if (papers.length > 0) {
      const ttl = isDemo ? 15000 : config.cache.researchTTL;
      await cacheService.set(cacheKey, result, ttl);
    }
    return result;
  },

  /**
   * Fetch from Crossref API
   */
  async fetchFromCrossref(query, field, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const searchQuery = field ? `${query} ${field}` : query;

    const params = new URLSearchParams({
      query: searchQuery,
      rows: String(limit),
      offset: String(offset),
      sort: 'published',
      order: 'desc',
      'filter': 'type:journal-article',
    });

    const res = await fetch(`${config.crossrefUrl}/works?${params}`, {
      headers: { 'User-Agent': 'WorldScope/1.0 (mailto:worldscope@example.com)' },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`Crossref returned ${res.status}`);

    const data = await res.json();
    const items = data.message?.items || [];

    return items.map(item => this.normalizeCrossref(item));
  },

  normalizeCrossref(item) {
    const published = item.published?.['date-parts']?.[0];
    const publishedDate = published
      ? new Date(published[0], (published[1] || 1) - 1, published[2] || 1)
      : null;

    return {
      title: Array.isArray(item.title) ? item.title[0] : (item.title || 'Untitled'),
      authors: (item.author || []).map(a => `${a.given || ''} ${a.family || ''}`.trim()).slice(0, 5),
      institution: item.publisher || '',
      field: this.classifyField(item.subject || [], item.title?.[0] || ''),
      abstract: item.abstract ? item.abstract.replace(/<[^>]+>/g, '').substring(0, 500) : '',
      doi: item.DOI || '',
      url: item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : ''),
      journal: Array.isArray(item['container-title']) ? item['container-title'][0] : (item['container-title'] || ''),
      publishedAt: publishedDate,
      citationCount: item['is-referenced-by-count'] || 0,
    };
  },

  classifyField(subjects, title) {
    const all = [...subjects, title].join(' ').toLowerCase();
    if (/computer|software|algorithm|machine learning|ai\b|data science/i.test(all)) return 'Computer Science';
    if (/medic|health|clinical|disease|patient|pharma|drug/i.test(all)) return 'Medicine';
    if (/engineer|mechanical|electrical|civil/i.test(all)) return 'Engineering';
    if (/physic|quantum|particle|astro/i.test(all)) return 'Physics';
    if (/biolog|gene|cell|molecular|organism/i.test(all)) return 'Biology';
    if (/chem|molecule|reaction|compound/i.test(all)) return 'Chemistry';
    if (/econom|market|financ|trade/i.test(all)) return 'Economics';
    if (/math|statistic|probability/i.test(all)) return 'Mathematics';
    if (/environ|climate|ecolog|sustain/i.test(all)) return 'Environmental Science';
    if (/material|polymer|nano|composite/i.test(all)) return 'Materials Science';
    if (/neuro|brain|cognit/i.test(all)) return 'Neuroscience';
    if (/psychol|behavior|mental/i.test(all)) return 'Psychology';
    return 'Social Sciences';
  },

  async persistResearch(papers, countryCode) {
    try {
      const ops = papers
        .filter(p => p.doi || p.url)
        .map(paper => ({
          updateOne: {
            filter: { $or: [{ doi: paper.doi }, { url: paper.url }] },
            update: { $set: { ...paper, countryCode: countryCode?.toUpperCase(), fetchedAt: new Date() } },
            upsert: true,
          },
        }));
      if (ops.length) await Research.bulkWrite(ops, { ordered: false });
    } catch { /* ignore duplicates */ }
  },

  getDemoResearch(countryCode, countryName) {
    return [
      { title: 'Research data is sourced from Crossref academic database', authors: ['WorldScope'], institution: 'WorldScope Demo', field: 'Computer Science', abstract: `Connect to live data sources for research papers from ${countryName || 'global'} institutions.`, doi: '', url: '#demo', journal: 'Demo', publishedAt: new Date(), isDemo: true },
    ];
  },

  getFields() {
    return FIELDS;
  },
};

export default researchService;
