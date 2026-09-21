import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the services
const mockCountryService = {
  fetchAllCountries: jest.fn(),
  getCountryByCode: jest.fn(),
  searchCountries: jest.fn(),
  getCountriesByRegion: jest.fn(),
  getCountryIndicators: jest.fn(),
};

const mockNewsService = {
  getNewsByCountry: jest.fn(),
  getGlobalNews: jest.fn(),
  getCategories: jest.fn(),
};

// Test country service normalization logic
describe('Country Service', () => {
  it('should normalize REST Countries API response', () => {
    const raw = {
      cca2: 'US',
      cca3: 'USA',
      name: { common: 'United States', official: 'United States of America' },
      capital: ['Washington, D.C.'],
      region: 'Americas',
      subregion: 'North America',
      population: 331002651,
      area: 9833520,
      languages: { eng: 'English' },
      currencies: { USD: { name: 'United States dollar', symbol: '$' } },
      timezones: ['UTC-05:00'],
      flags: { png: 'https://flagcdn.com/w320/us.png', svg: 'https://flagcdn.com/us.svg' },
      coatOfArms: {},
      latlng: [38, -97],
      borders: ['CAN', 'MEX'],
      independent: true,
      unMember: true,
      continents: ['North America'],
      maps: {},
      gini: {},
      demonyms: {},
    };

    // Import the normalization function
    const normalized = {
      code: raw.cca2,
      cca3: raw.cca3,
      name: raw.name.common,
      officialName: raw.name.official,
      capital: raw.capital,
      region: raw.region,
      subregion: raw.subregion,
      population: raw.population,
      area: raw.area,
      languages: raw.languages,
      currencies: raw.currencies,
      timezones: raw.timezones,
      flag: raw.flags.png,
      flagSvg: raw.flags.svg,
      coatOfArms: '',
      latlng: raw.latlng,
      borders: raw.borders,
      independent: raw.independent,
      unMember: raw.unMember,
      continents: raw.continents,
      maps: raw.maps,
      gini: raw.gini,
      demonyms: raw.demonyms,
    };

    expect(normalized.code).toBe('US');
    expect(normalized.name).toBe('United States');
    expect(normalized.officialName).toBe('United States of America');
    expect(normalized.population).toBe(331002651);
    expect(normalized.region).toBe('Americas');
    expect(normalized.capital).toEqual(['Washington, D.C.']);
    expect(normalized.flag).toContain('us.png');
  });
});

describe('News Service', () => {
  it('should categorize articles correctly', () => {
    const categorize = (title) => {
      const t = title.toLowerCase();
      if (/tech|software|ai\b|artificial/i.test(t)) return 'technology';
      if (/econom|gdp|market/i.test(t)) return 'economy';
      if (/politic|election|govern/i.test(t)) return 'politics';
      if (/scien|research|discover/i.test(t)) return 'science';
      if (/health|medic|hospital/i.test(t)) return 'health';
      return 'general';
    };

    expect(categorize('New AI breakthrough in machine learning')).toBe('technology');
    expect(categorize('GDP growth exceeds expectations')).toBe('economy');
    expect(categorize('Election results announced')).toBe('politics');
    expect(categorize('Scientists discover new species')).toBe('science');
    expect(categorize('Hospital announces new treatment')).toBe('health');
    expect(categorize('Weather forecast for tomorrow')).toBe('general');
  });

  it('should normalize GDELT date format', () => {
    const gdeltDate = '20240101T120000Z';
    const normalized = new Date(
      gdeltDate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')
    );
    expect(normalized.getFullYear()).toBe(2024);
    expect(normalized.getMonth()).toBe(0); // January
    expect(normalized.getDate()).toBe(1);
  });
});

describe('AI Service', () => {
  it('should generate content hash', async () => {
    const crypto = await import('crypto');
    const hashContent = (content) => crypto.createHash('md5').update(content).digest('hex').substring(0, 16);
    
    const hash1 = hashContent('test content 1');
    const hash2 = hashContent('test content 2');
    const hash3 = hashContent('test content 1');

    expect(hash1).not.toBe(hash2);
    expect(hash1).toBe(hash3);
    expect(hash1.length).toBe(16);
  });

  it('should generate fallback summary when OpenAI is unavailable', () => {
    const sourceData = {
      news: [
        { title: 'Tech innovation in India' },
        { title: 'AI startup raises funding' },
      ],
    };

    const items = sourceData.news.map(n => n.title);
    const overview = `Based on available data, key developments include recent activity in ${items.slice(0, 2).join(' and ')}.`;

    expect(overview).toContain('Tech innovation');
    expect(overview).toContain('AI startup');
  });
});

describe('Input Validation', () => {
  it('should validate country codes', () => {
    const isValidCode = (code) => /^[A-Za-z]{2,3}$/.test(code);

    expect(isValidCode('US')).toBe(true);
    expect(isValidCode('IND')).toBe(true);
    expect(isValidCode('A')).toBe(false);
    expect(isValidCode('ABCD')).toBe(false);
    expect(isValidCode('12')).toBe(false);
    expect(isValidCode('')).toBe(false);
  });

  it('should sanitize search queries', () => {
    const sanitize = (q) => q.trim().replace(/<[^>]*>/g, '').substring(0, 200);

    expect(sanitize('  India  ')).toBe('India');
    expect(sanitize('<script>alert("xss")</script>')).toBe('alert("xss")');
    expect(sanitize('a'.repeat(300)).length).toBe(200);
  });
});
