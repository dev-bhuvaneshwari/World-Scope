import config from '../config/env.js';
import News from '../models/News.js';
import cacheService from './cacheService.js';

const NEWS_CATEGORIES = ['politics', 'economy', 'technology', 'science', 'business', 'startups', 'education', 'health', 'environment', 'general'];

// Map country codes to GDELT-compatible country names
const COUNTRY_NAME_MAP = {
  'US': 'United States', 'GB': 'United Kingdom', 'IN': 'India', 'CN': 'China',
  'JP': 'Japan', 'DE': 'Germany', 'FR': 'France', 'BR': 'Brazil',
  'AU': 'Australia', 'CA': 'Canada', 'RU': 'Russia', 'KR': 'South Korea',
  'IT': 'Italy', 'ES': 'Spain', 'MX': 'Mexico', 'ID': 'Indonesia',
  'NG': 'Nigeria', 'ZA': 'South Africa', 'SA': 'Saudi Arabia', 'AE': 'UAE',
  'SG': 'Singapore', 'IL': 'Israel', 'SE': 'Sweden', 'CH': 'Switzerland',
  'NL': 'Netherlands', 'PL': 'Poland', 'TR': 'Turkey', 'EG': 'Egypt',
  'AR': 'Argentina', 'CO': 'Colombia', 'KE': 'Kenya', 'TH': 'Thailand',
};

const newsService = {
  /**
   * Fetch news for a country with fallback chain:
   * Google News RSS -> GDELT -> GNews -> DB cache -> demo data
   */
  async getNewsByCountry(countryCode, countryName, options = {}) {
    const { category, page = 1, limit = 20 } = options;
    const cacheKey = `news:${countryCode}:${category || 'all'}:${page}`;

    const cached = await cacheService.get(cacheKey);
    if (cached && !cached.isDemo) return cached;

    let articles = [];

    // Source 1: Google News RSS (Fast, live, real-time, no API key needed)
    try {
      articles = await this.fetchFromGoogleNews(countryCode, countryName, category, limit);
    } catch (e) {
      console.warn('Google News RSS fetch failed:', e.message);
    }

    // Source 2: GDELT (if Google News RSS returned nothing)
    if (articles.length === 0) {
      try {
        articles = await this.fetchFromGDELT(countryCode, countryName, category, limit);
      } catch (e) {
        console.warn('GDELT fetch failed:', e.message);
      }
    }

    // Source 3: GNews (if API key available)
    if (articles.length === 0 && config.gnewsApiKey) {
      try {
        articles = await this.fetchFromGNews(countryCode, countryName, category, limit);
      } catch (e) {
        console.warn('GNews fetch failed:', e.message);
      }
    }

    // Source 4: Database cache
    if (articles.length === 0) {
      try {
        const query = { countryCode: countryCode.toUpperCase() };
        if (category) query.category = category;
        const dbArticles = await News.find(query)
          .sort({ publishedAt: -1 })
          .limit(limit)
          .skip((page - 1) * limit)
          .lean();
        if (dbArticles.length > 0) {
          articles = dbArticles;
        }
      } catch {
        // DB failed
      }
    }

    // Source 5: Demo data fallback (last resort only)
    if (articles.length === 0) {
      articles = this.getDemoNews(countryCode, countryName, category);
    }

    const isDemo = articles.length > 0 && articles[0]?.isDemo === true;
    const result = { articles, total: articles.length, page, isDemo };

    if (articles.length > 0) {
      const ttl = isDemo ? 15000 : config.cache.newsTTL;
      await cacheService.set(cacheKey, result, ttl);
      
      // Persist to DB only if real
      if (!isDemo) {
        this.persistNews(articles).catch(() => {});
      }
    }

    return result;
  },

  /**
   * Fetch global/trending news
   */
  async getGlobalNews(options = {}) {
    const { category, page = 1, limit = 20 } = options;
    const cacheKey = `news:global:${category || 'all'}:${page}`;

    const cached = await cacheService.get(cacheKey);
    if (cached && !cached.isDemo) return cached;

    let articles = [];

    // Source 1: Google News RSS
    try {
      articles = await this.fetchFromGoogleNews('', 'World', category, limit);
    } catch (e) {
      console.warn('Global Google News RSS fetch failed:', e.message);
    }

    // Source 2: GDELT
    if (articles.length === 0) {
      try {
        const query = category ? `${category} world` : 'world news today';
        const params = new URLSearchParams({
          query,
          mode: 'ArtList',
          maxrecords: String(limit),
          format: 'json',
          sort: 'DateDesc',
          timespan: '7d',
        });

        const res = await fetch(`${config.gdeltUrl}?${params}`, {
          signal: AbortSignal.timeout(6000),
        });
        if (res.ok) {
          const data = await res.json();
          articles = (data.articles || []).map(a => this.normalizeGDELT(a));
        }
      } catch (e) {
        console.warn('Global GDELT fetch failed:', e.message);
      }
    }

    if (articles.length === 0) {
      articles = this.getDemoNews('', 'World', category);
    }

    const isDemo = articles.length > 0 && articles[0]?.isDemo === true;
    const result = { articles, total: articles.length, page, isDemo };
    if (articles.length > 0) {
      const ttl = isDemo ? 15000 : config.cache.newsTTL;
      await cacheService.set(cacheKey, result, ttl);
    }

    return result;
  },

  /**
   * Google News RSS feed (High reliability, real-time, 100% free)
   */
  async fetchFromGoogleNews(countryCode, countryName, category, limit = 20) {
    const name = countryName || COUNTRY_NAME_MAP[countryCode?.toUpperCase()] || countryCode || '';
    let query = '';
    if (name && category) {
      query = `${name} ${category}`;
    } else if (name) {
      query = name;
    } else if (category) {
      query = `${category} news`;
    } else {
      query = 'world news';
    }

    const gl = (countryCode && countryCode.length === 2) ? countryCode.toUpperCase() : 'US';
    const ceid = `${gl}:en`;
    const primaryUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en&gl=${gl}&ceid=${ceid}`;
    const fallbackUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en`;

    for (const url of [primaryUrl, fallbackUrl]) {
      try {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(5000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });

        if (res.ok) {
          const xml = await res.text();
          const items = this.parseRssNews(xml, countryCode, name, category, limit);
          if (items.length > 0) return items;
        }
      } catch {
        // Continue to fallback
      }
    }
    return [];
  },

  /**
   * Parse RSS XML from Google News
   */
  parseRssNews(xml, countryCode, countryName, defaultCategory, limit = 20) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
      const raw = match[1];
      const titleMatch = raw.match(/<title>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/title>/);
      const linkMatch = raw.match(/<link>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/link>/);
      const pubDateMatch = raw.match(/<pubDate>(.*?)<\/pubDate>/);
      const sourceMatch = raw.match(/<source[^>]*url=["'](.*?)["'][^>]*>(.*?)<\/source>/) || raw.match(/<source[^>]*>(.*?)<\/source>/);

      let rawTitle = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : '';
      rawTitle = rawTitle.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

      const source = sourceMatch ? (sourceMatch[2] || sourceMatch[1] || 'News').trim() : 'News';
      const sourceUrl = (sourceMatch && sourceMatch[1] && sourceMatch[1].startsWith('http')) ? sourceMatch[1] : '';
      const link = linkMatch ? (linkMatch[1] || linkMatch[2] || '').trim() : '';
      const pubDate = pubDateMatch ? new Date(pubDateMatch[1]) : new Date();

      let title = rawTitle;
      if (source && title.endsWith(' - ' + source)) {
        title = title.slice(0, -(source.length + 3)).trim();
      }

      if (title && link) {
        items.push({
          title,
          description: title,
          source,
          sourceUrl,
          url: link,
          imageUrl: '',
          publishedAt: pubDate,
          countryCode: (countryCode || '').toUpperCase(),
          countryName: countryName || '',
          category: defaultCategory || this.categorizeArticle(title),
          language: 'English',
          isDemo: false,
        });
      }
    }
    return items;
  },


  /**
   * GDELT DOC API
   */
  async fetchFromGDELT(countryCode, countryName, category, limit = 20) {
    const name = countryName || COUNTRY_NAME_MAP[countryCode.toUpperCase()] || countryCode;
    const query = category ? `${name} ${category}` : name;

    const params = new URLSearchParams({
      query,
      mode: 'ArtList',
      maxrecords: String(limit),
      format: 'json',
      sort: 'DateDesc',
      timespan: '7d',
    });

    const res = await fetch(`${config.gdeltUrl}?${params}`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`GDELT returned ${res.status}`);

    const data = await res.json();
    return (data.articles || []).map(a => this.normalizeGDELT(a, countryCode, name));
  },

  /**
   * GNews API
   */
  async fetchFromGNews(countryCode, countryName, category, limit = 10) {
    const name = countryName || COUNTRY_NAME_MAP[countryCode.toUpperCase()] || countryCode;
    const params = new URLSearchParams({
      q: name,
      lang: 'en',
      max: String(Math.min(limit, 10)),
      apikey: config.gnewsApiKey,
    });
    if (category) params.set('topic', this.mapCategoryToGNews(category));

    const res = await fetch(`https://gnews.io/api/v4/search?${params}`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`GNews returned ${res.status}`);

    const data = await res.json();
    return (data.articles || []).map(a => this.normalizeGNews(a, countryCode, name));
  },

  normalizeGDELT(article, countryCode = '', countryName = '') {
    return {
      title: article.title || 'Untitled',
      description: article.seendate ? `Published on ${article.seendate}` : '',
      source: article.domain || article.source || 'Unknown',
      sourceUrl: article.socialimage ? `https://${article.domain}` : '',
      url: article.url || '',
      imageUrl: article.socialimage || '',
      publishedAt: article.seendate ? new Date(article.seendate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')) : new Date(),
      countryCode: countryCode.toUpperCase(),
      countryName,
      category: this.categorizeArticle(article.title || ''),
      language: article.language || 'English',
    };
  },

  normalizeGNews(article, countryCode = '', countryName = '') {
    return {
      title: article.title || 'Untitled',
      description: article.description || '',
      source: article.source?.name || 'Unknown',
      sourceUrl: article.source?.url || '',
      url: article.url || '',
      imageUrl: article.image || '',
      publishedAt: article.publishedAt ? new Date(article.publishedAt) : new Date(),
      countryCode: countryCode.toUpperCase(),
      countryName,
      category: this.categorizeArticle(article.title || ''),
      language: 'en',
    };
  },

  categorizeArticle(title) {
    const t = title.toLowerCase();
    if (/politic|election|govern|parliament|congress|vote|president|minister|diplomac/i.test(t)) return 'politics';
    if (/econom|gdp|inflation|trade|market|stock|financ|bank|fiscal|monetary/i.test(t)) return 'economy';
    if (/tech|software|app|digital|cyber|ai\b|artificial|robot|comput|startup/i.test(t)) return 'technology';
    if (/scien|research|discover|study|space|quantum|physics|biology|chem/i.test(t)) return 'science';
    if (/business|company|corporate|revenue|merger|acquisition|profit/i.test(t)) return 'business';
    if (/startup|unicorn|venture|incubat|accelerat|founder|seed fund/i.test(t)) return 'startups';
    if (/educat|school|university|student|teacher|curriculum|learning/i.test(t)) return 'education';
    if (/health|medic|hospital|vaccin|disease|pandemic|pharma|drug|mental/i.test(t)) return 'health';
    if (/environ|climate|green|sustain|carbon|emission|renewable|solar|wind/i.test(t)) return 'environment';
    return 'general';
  },

  mapCategoryToGNews(category) {
    const map = {
      'politics': 'nation', 'economy': 'business', 'technology': 'technology',
      'science': 'science', 'business': 'business', 'health': 'health',
      'environment': 'science', 'education': 'nation',
    };
    return map[category] || 'general';
  },

  async persistNews(articles) {
    try {
      const ops = articles
        .filter(a => a.url)
        .map(article => ({
          updateOne: {
            filter: { url: article.url },
            update: { $set: { ...article, fetchedAt: new Date() } },
            upsert: true,
          },
        }));
      if (ops.length) await News.bulkWrite(ops, { ordered: false });
    } catch {
      // Ignore duplicate key errors
    }
  },

  getDemoNews(countryCode, countryName, category) {
    const demoArticles = [
      { title: `${countryName || 'Global'}: Economic outlook remains cautiously optimistic`, category: 'economy', description: 'Analysts note steady growth indicators in the latest quarterly report.' },
      { title: `Technology sector sees increased investment in ${countryName || 'global markets'}`, category: 'technology', description: 'Venture capital flows into AI and clean technology startups continue to grow.' },
      { title: `New research initiatives launched in ${countryName || 'multiple countries'}`, category: 'science', description: 'Universities and research institutions announce collaborative programs.' },
      { title: `${countryName || 'Global'} healthcare systems adopt new digital solutions`, category: 'health', description: 'Digital health platforms see widespread adoption across healthcare systems.' },
      { title: `Renewable energy capacity expands in ${countryName || 'global markets'}`, category: 'environment', description: 'Solar and wind energy installations reach new milestones.' },
    ];

    return demoArticles
      .filter(a => !category || a.category === category)
      .map((a, i) => ({
        ...a,
        source: 'WorldScope Demo',
        url: `#demo-${i}`,
        imageUrl: '',
        publishedAt: new Date(),
        countryCode: countryCode?.toUpperCase() || '',
        countryName: countryName || 'World',
        language: 'en',
        isDemo: true,
      }));
  },

  getCategories() {
    return NEWS_CATEGORIES;
  },
};

export default newsService;
