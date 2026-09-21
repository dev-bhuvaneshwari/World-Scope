import config from '../config/env.js';
import Startup from '../models/Startup.js';
import cacheService from './cacheService.js';

const SECTORS = [
  'AI', 'Renewable Energy', 'EV', 'Semiconductors', 'Biotechnology',
  'Space', 'FinTech', 'HealthTech', 'EdTech', 'Robotics',
  'AgriTech', 'CleanTech', 'Cybersecurity', 'SaaS', 'E-commerce',
];

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

const startupService = {
  /**
   * Get startup/innovation activity for a country
   */
  async getStartupsByCountry(countryCode, countryName, options = {}) {
    const { sector, page = 1, limit = 20 } = options;
    const cacheKey = `startups:${countryCode}:${sector || 'all'}:${page}`;

    const cached = await cacheService.get(cacheKey);
    if (cached && !cached.isDemo) return cached;

    let startups = [];

    // Source 1: Google News RSS (Fast, real-time, free)
    try {
      startups = await this.fetchFromGoogleNews(countryCode, countryName, sector, limit);
    } catch (e) {
      console.warn('Startup Google News RSS fetch failed:', e.message);
    }

    // Source 2: GDELT
    if (startups.length === 0) {
      try {
        const name = countryName || COUNTRY_NAME_MAP[countryCode?.toUpperCase()] || countryCode;
        const query = sector
          ? `${name} ${sector} startup funding`
          : `${name} startup innovation venture`;

        const params = new URLSearchParams({
          query,
          mode: 'ArtList',
          maxrecords: String(limit),
          format: 'json',
          sort: 'DateDesc',
          timespan: '30d',
        });

        const res = await fetch(`${config.gdeltUrl}?${params}`, {
          signal: AbortSignal.timeout(6000),
        });

        if (res.ok) {
          const data = await res.json();
          startups = (data.articles || []).map(a => ({
            name: this.extractStartupName(a.title || ''),
            description: a.title || '',
            sector: this.categorizeSector(a.title || ''),
            countryCode: countryCode.toUpperCase(),
            countryName: name,
            source: a.domain || 'News',
            url: a.url || '',
            activity: 'News mention',
            publishedAt: a.seendate ? new Date(a.seendate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')) : new Date(),
            isDemo: false,
          }));
        }
      } catch (e) {
        console.warn('Startup GDELT fetch failed:', e.message);
      }
    }

    // Fallback: DB
    if (startups.length === 0) {
      try {
        const query = { countryCode: countryCode.toUpperCase() };
        if (sector) query.sector = sector;
        startups = await Startup.find(query).sort({ publishedAt: -1 }).limit(limit).lean();
      } catch { /* ignore */ }
    }

    // Demo fallback (last resort)
    if (startups.length === 0) {
      startups = this.getDemoStartups(countryCode, countryName);
    }

    const isDemo = startups.length > 0 && startups[0]?.isDemo === true;
    const result = { startups, total: startups.length, page, sectors: SECTORS, isDemo };
    if (startups.length > 0) {
      const ttl = isDemo ? 15000 : config.cache.technologyTTL;
      await cacheService.set(cacheKey, result, ttl);
    }
    return result;
  },

  /**
   * Get global startup activity
   */
  async getGlobalStartups(options = {}) {
    const { sector, limit = 20 } = options;
    const cacheKey = `startups:global:${sector || 'all'}`;

    const cached = await cacheService.get(cacheKey);
    if (cached && !cached.isDemo) return cached;

    let startups = [];

    // Source 1: Google News RSS
    try {
      startups = await this.fetchFromGoogleNews('', 'World', sector, limit);
    } catch (e) {
      console.warn('Global Startup Google News RSS fetch failed:', e.message);
    }

    // Source 2: GDELT
    if (startups.length === 0) {
      try {
        const query = sector ? `${sector} startup funding raised` : 'startup unicorn funding innovation';
        const params = new URLSearchParams({
          query,
          mode: 'ArtList',
          maxrecords: String(limit),
          format: 'json',
          sort: 'DateDesc',
          timespan: '14d',
        });

        const res = await fetch(`${config.gdeltUrl}?${params}`, {
          signal: AbortSignal.timeout(6000),
        });

        if (res.ok) {
          const data = await res.json();
          startups = (data.articles || []).map(a => ({
            name: this.extractStartupName(a.title || ''),
            description: a.title || '',
            sector: this.categorizeSector(a.title || ''),
            countryCode: '',
            countryName: '',
            source: a.domain || 'News',
            url: a.url || '',
            activity: 'News mention',
            publishedAt: a.seendate ? new Date(a.seendate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')) : new Date(),
            isDemo: false,
          }));
        }
      } catch { /* ignore */ }
    }

    if (startups.length === 0) {
      startups = this.getDemoStartups('', 'Global');
    }

    const isDemo = startups.length > 0 && startups[0]?.isDemo === true;
    const result = { startups, total: startups.length, sectors: SECTORS, isDemo };
    if (startups.length > 0) {
      const ttl = isDemo ? 15000 : config.cache.technologyTTL;
      await cacheService.set(cacheKey, result, ttl);
    }
    return result;
  },

  /**
   * Google News RSS for startups
   */
  async fetchFromGoogleNews(countryCode, countryName, sector, limit = 20) {
    const name = countryName || COUNTRY_NAME_MAP[countryCode?.toUpperCase()] || countryCode || '';
    let query = '';
    if (name && sector) {
      query = `${name} ${sector} startup funding OR venture`;
    } else if (name) {
      query = `${name} startup funding OR investment OR venture`;
    } else if (sector) {
      query = `${sector} startup funding OR venture investment`;
    } else {
      query = 'startup funding OR "venture capital" OR unicorn tech';
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
          const items = this.parseRssStartups(xml, countryCode, name, sector, limit);
          if (items.length > 0) return items;
        }
      } catch {
        // Continue to fallback
      }
    }
    return [];
  },

  parseRssStartups(xml, countryCode, countryName, defaultSector, limit = 20) {
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
      const link = linkMatch ? (linkMatch[1] || linkMatch[2] || '').trim() : '';
      const pubDate = pubDateMatch ? new Date(pubDateMatch[1]) : new Date();

      let title = rawTitle;
      if (source && title.endsWith(' - ' + source)) {
        title = title.slice(0, -(source.length + 3)).trim();
      }

      if (title && link) {
        items.push({
          name: this.extractStartupName(title),
          description: title,
          sector: defaultSector || this.categorizeSector(title),
          countryCode: (countryCode || '').toUpperCase(),
          countryName: countryName || '',
          source,
          url: link,
          activity: 'Venture & Funding News',
          publishedAt: pubDate,
          isDemo: false,
        });
      }
    }
    return items;
  },

  extractStartupName(title) {
    const parts = title.split(/[:\-–—|]/);
    return parts[0].trim().substring(0, 80);
  },

  categorizeSector(title) {
    const t = title.toLowerCase();
    if (/\bai\b|artificial intelligence|machine learning/i.test(t)) return 'AI';
    if (/fintech|payment|banking|neobank/i.test(t)) return 'FinTech';
    if (/healthtech|health|medic|biotech|pharma/i.test(t)) return 'HealthTech';
    if (/edtech|education|learning/i.test(t)) return 'EdTech';
    if (/cleantech|clean|green|sustain/i.test(t)) return 'CleanTech';
    if (/renewable|solar|wind|energy|ev\b|electric/i.test(t)) return 'Renewable Energy';
    if (/space|satellite|rocket/i.test(t)) return 'Space';
    if (/cyber|security/i.test(t)) return 'Cybersecurity';
    if (/saas|software|cloud/i.test(t)) return 'SaaS';
    if (/ecommerce|e-commerce|retail|shop/i.test(t)) return 'E-commerce';
    if (/robot|automat/i.test(t)) return 'Robotics';
    if (/agri|farm|food/i.test(t)) return 'AgriTech';
    if (/semiconductor|chip/i.test(t)) return 'Semiconductors';
    return 'Other';
  },

  getDemoStartups(countryCode, countryName) {
    return [
      { name: 'Startup ecosystem activity', description: `Startup activity in ${countryName || 'global markets'} across AI, FinTech, and green energy.`, sector: 'AI', countryCode, countryName, source: 'WorldScope Demo', url: '#demo', activity: 'Demo data — connect API sources for live information', publishedAt: new Date(), isDemo: true },
    ];
  },

  getSectors() {
    return SECTORS;
  },
};

export default startupService;
