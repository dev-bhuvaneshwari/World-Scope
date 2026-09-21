import config from '../config/env.js';
import Technology from '../models/Technology.js';
import cacheService from './cacheService.js';

const TECH_CATEGORIES = [
  'ai', 'cloud', 'cybersecurity', 'robotics', 'semiconductors',
  'web', 'mobile', 'quantum', 'biotech', 'renewable-energy',
  'space', 'fintech', 'blockchain', 'iot', 'other'
];

const TECH_CATEGORY_LABELS = {
  'ai': 'Artificial Intelligence', 'cloud': 'Cloud Computing', 'cybersecurity': 'Cybersecurity',
  'robotics': 'Robotics', 'semiconductors': 'Semiconductors', 'web': 'Web Development',
  'mobile': 'Mobile', 'quantum': 'Quantum Computing', 'biotech': 'Biotechnology',
  'renewable-energy': 'Renewable Energy', 'space': 'Space Technology',
  'fintech': 'FinTech', 'blockchain': 'Blockchain', 'iot': 'IoT', 'other': 'Other',
};

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

const technologyService = {
  /**
   * Get technology trends for a country
   */
  async getTechByCountry(countryCode, countryName, options = {}) {
    const { category, page = 1, limit = 20 } = options;
    const cacheKey = `tech:${countryCode}:${category || 'all'}:${page}`;

    const cached = await cacheService.get(cacheKey);
    if (cached && !cached.isDemo) return cached;

    let trends = [];

    // Source 1: Google News RSS for country tech trends (Fast, live, real-time)
    try {
      trends = await this.fetchFromGoogleNews(countryCode, countryName, category, limit);
    } catch (e) {
      console.warn('Tech Google News RSS fetch failed:', e.message);
    }

    // Source 2: GDELT
    if (trends.length === 0) {
      try {
        const name = countryName || COUNTRY_NAME_MAP[countryCode?.toUpperCase()] || countryCode;
        const query = category
          ? `${name} ${TECH_CATEGORY_LABELS[category] || category} technology`
          : `${name} technology innovation`;

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
          trends = (data.articles || []).map(a => ({
            name: this.extractTechName(a.title || ''),
            category: this.categorizeTech(a.title || ''),
            description: a.title || '',
            source: a.domain || 'Unknown',
            url: a.url || '',
            countryCode: countryCode.toUpperCase(),
            countryName: name,
            publishedAt: a.seendate ? new Date(a.seendate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')) : new Date(),
            isDemo: false,
          }));
        }
      } catch (e) {
        console.warn('Tech GDELT fetch failed:', e.message);
      }
    }

    // Fallback to DB
    if (trends.length === 0) {
      try {
        const query = { countryCode: countryCode.toUpperCase() };
        if (category) query.category = category;
        trends = await Technology.find(query).sort({ publishedAt: -1 }).limit(limit).lean();
      } catch { /* ignore */ }
    }

    // Demo fallback (last resort)
    if (trends.length === 0) {
      trends = this.getDemoTech(countryCode, countryName);
    }

    if (category) {
      trends = trends.filter(t => t.category === category);
    }

    const isDemo = trends.length > 0 && trends[0]?.isDemo === true;
    const result = { trends, total: trends.length, page, categories: TECH_CATEGORIES, isDemo };
    if (trends.length > 0) {
      const ttl = isDemo ? 15000 : config.cache.technologyTTL;
      await cacheService.set(cacheKey, result, ttl);
    }
    return result;
  },

  /**
   * Get global technology trends
   */
  async getGlobalTrends(options = {}) {
    const { category, limit = 30 } = options;
    const cacheKey = `tech:global:${category || 'all'}`;

    const cached = await cacheService.get(cacheKey);
    if (cached && !cached.isDemo) return cached;

    let trends = [];

    // Fetch from GitHub trending
    try {
      trends = await this.fetchGitHubTrending(Math.min(limit, 15));
    } catch (e) {
      console.warn('GitHub trending failed:', e.message);
    }

    // Also fetch live tech news globally via Google News RSS
    try {
      const newsTrends = await this.fetchFromGoogleNews('', 'World', category, Math.min(limit, 15));
      trends = [...trends, ...newsTrends];
    } catch (e) {
      console.warn('Global Tech Google News RSS failed:', e.message);
    }

    // GDELT fallback if still empty
    if (trends.length === 0) {
      try {
        const query = category ? `${TECH_CATEGORY_LABELS[category] || category} technology` : 'technology innovation trends';
        const params = new URLSearchParams({
          query,
          mode: 'ArtList',
          maxrecords: '20',
          format: 'json',
          sort: 'DateDesc',
          timespan: '7d',
        });

        const res = await fetch(`${config.gdeltUrl}?${params}`, {
          signal: AbortSignal.timeout(6000),
        });

        if (res.ok) {
          const data = await res.json();
          const articles = (data.articles || []).map(a => ({
            name: this.extractTechName(a.title || ''),
            category: this.categorizeTech(a.title || ''),
            description: a.title || '',
            source: a.domain || 'Unknown',
            url: a.url || '',
            countryCode: '',
            countryName: '',
            publishedAt: a.seendate ? new Date(a.seendate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')) : new Date(),
            isDemo: false,
          }));
          trends = [...trends, ...articles];
        }
      } catch { /* ignore */ }
    }

    if (trends.length === 0) {
      trends = this.getDemoTech('', 'Global');
    }

    const isDemo = trends.length > 0 && trends[0]?.isDemo === true;
    const result = { trends, total: trends.length, categories: TECH_CATEGORIES, categoryLabels: TECH_CATEGORY_LABELS, isDemo };
    if (trends.length > 0) {
      const ttl = isDemo ? 15000 : config.cache.technologyTTL;
      await cacheService.set(cacheKey, result, ttl);
    }
    return result;
  },

  /**
   * Google News RSS for technology
   */
  async fetchFromGoogleNews(countryCode, countryName, category, limit = 20) {
    const name = countryName || COUNTRY_NAME_MAP[countryCode?.toUpperCase()] || countryCode || '';
    let query = '';
    const catLabel = category ? (TECH_CATEGORY_LABELS[category] || category) : '';

    if (name && catLabel) {
      query = `${name} ${catLabel} technology`;
    } else if (name) {
      query = `${name} technology innovation OR AI OR semiconductor`;
    } else if (catLabel) {
      query = `${catLabel} technology innovation`;
    } else {
      query = 'technology innovation OR artificial intelligence OR robotics';
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
          const items = this.parseRssTech(xml, countryCode, name, category, limit);
          if (items.length > 0) return items;
        }
      } catch {
        // Continue to fallback
      }
    }
    return [];
  },

  parseRssTech(xml, countryCode, countryName, defaultCategory, limit = 20) {
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
          name: this.extractTechName(title),
          category: defaultCategory || this.categorizeTech(title),
          description: title,
          source,
          url: link,
          countryCode: (countryCode || '').toUpperCase(),
          countryName: countryName || '',
          publishedAt: pubDate,
          isDemo: false,
        });
      }
    }
    return items;
  },

  /**
   * Fetch trending GitHub repositories
   */
  async fetchGitHubTrending(limit = 20) {
    const headers = { Accept: 'application/vnd.github.v3+json' };
    if (config.githubToken) headers.Authorization = `token ${config.githubToken}`;

    const date = new Date();
    date.setDate(date.getDate() - 7);
    const since = date.toISOString().split('T')[0];

    const res = await fetch(
      `https://api.github.com/search/repositories?q=created:>${since}&sort=stars&order=desc&per_page=${limit}`,
      { headers, signal: AbortSignal.timeout(6000) }
    );

    if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);

    const data = await res.json();
    return (data.items || []).map(repo => ({
      name: repo.full_name,
      category: this.categorizeByLanguage(repo.language),
      description: repo.description || '',
      source: 'GitHub',
      url: repo.html_url,
      countryCode: '',
      countryName: '',
      publishedAt: new Date(repo.created_at),
      stars: repo.stargazers_count,
      language: repo.language,
      type: 'github',
      isDemo: false,
    }));
  },

  extractTechName(title) {
    const techPatterns = [
      /\b(AI|artificial intelligence|machine learning|deep learning|GPT|LLM)\b/i,
      /\b(cloud|AWS|Azure|Google Cloud|kubernetes)\b/i,
      /\b(cybersecurity|data breach|ransomware|encryption)\b/i,
      /\b(robot|automation|drone)\b/i,
      /\b(semiconductor|chip|TSMC|Intel|NVIDIA)\b/i,
      /\b(quantum|qubit)\b/i,
      /\b(biotech|CRISPR|gene|genomic)\b/i,
      /\b(solar|wind|renewable|EV|electric vehicle|battery)\b/i,
      /\b(space|satellite|rocket|SpaceX|NASA)\b/i,
      /\b(fintech|cryptocurrency|bitcoin|blockchain)\b/i,
    ];

    for (const pattern of techPatterns) {
      const match = title.match(pattern);
      if (match) return match[1];
    }
    return title.split(/[:\-–—|]/).map(s => s.trim())[0].substring(0, 60);
  },

  categorizeTech(title) {
    const t = title.toLowerCase();
    if (/\bai\b|artificial intelligence|machine learning|deep learning|gpt|llm|neural/i.test(t)) return 'ai';
    if (/cloud|aws|azure|google cloud|kubernetes|saas/i.test(t)) return 'cloud';
    if (/cyber|security|breach|ransomware|hack|encrypt/i.test(t)) return 'cybersecurity';
    if (/robot|automat|drone/i.test(t)) return 'robotics';
    if (/semiconductor|chip|tsmc|intel|nvidia|amd/i.test(t)) return 'semiconductors';
    if (/web|javascript|react|frontend|backend/i.test(t)) return 'web';
    if (/mobile|ios|android|app store/i.test(t)) return 'mobile';
    if (/quantum|qubit/i.test(t)) return 'quantum';
    if (/biotech|crispr|gene|genom|pharma/i.test(t)) return 'biotech';
    if (/solar|wind|renewable|ev\b|electric vehicle|battery|hydrogen|clean energy/i.test(t)) return 'renewable-energy';
    if (/space|satellite|rocket|orbit|mars|moon|launch/i.test(t)) return 'space';
    if (/fintech|cryptocurrency|bitcoin|blockchain|defi|nft/i.test(t)) return 'fintech';
    if (/iot|smart home|sensor|wearable|connected/i.test(t)) return 'iot';
    return 'other';
  },

  categorizeByLanguage(lang) {
    if (!lang) return 'other';
    const l = lang.toLowerCase();
    if (['python', 'jupyter notebook'].includes(l)) return 'ai';
    if (['javascript', 'typescript', 'html', 'css', 'vue', 'svelte'].includes(l)) return 'web';
    if (['swift', 'kotlin', 'dart', 'objective-c'].includes(l)) return 'mobile';
    if (['rust', 'go', 'c', 'c++'].includes(l)) return 'cloud';
    if (['solidity'].includes(l)) return 'fintech';
    if (['r', 'julia'].includes(l)) return 'ai';
    return 'other';
  },

  getDemoTech(countryCode, countryName) {
    return [
      { name: 'Artificial Intelligence', category: 'ai', description: `AI development and adoption trends in ${countryName || 'global markets'}`, source: 'WorldScope Demo', url: '#demo', countryCode, countryName, publishedAt: new Date(), isDemo: true },
      { name: 'Cloud Computing', category: 'cloud', description: `Cloud infrastructure expansion and enterprise adoption in ${countryName || 'global markets'}`, source: 'WorldScope Demo', url: '#demo', countryCode, countryName, publishedAt: new Date(), isDemo: true },
      { name: 'Cybersecurity', category: 'cybersecurity', description: `Cybersecurity landscape and threat intelligence updates`, source: 'WorldScope Demo', url: '#demo', countryCode, countryName, publishedAt: new Date(), isDemo: true },
      { name: 'Renewable Energy', category: 'renewable-energy', description: `Clean energy technology advancements and market developments`, source: 'WorldScope Demo', url: '#demo', countryCode, countryName, publishedAt: new Date(), isDemo: true },
    ];
  },

  getCategories() {
    return TECH_CATEGORIES;
  },

  getCategoryLabels() {
    return TECH_CATEGORY_LABELS;
  },
};

export default technologyService;
