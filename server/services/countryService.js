import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/env.js';
import Country from '../models/Country.js';
import cacheService from './cacheService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_COUNTRIES_FILE = path.join(__dirname, '..', 'data', 'countries.json');

const CACHE_KEY = 'countries:all';
const COUNTRY_CACHE_KEY = (code) => `country:${code.toUpperCase()}`;

const countryService = {
  /**
   * Fetch all countries
   */
  async fetchAllCountries() {
    // Check cache
    const cached = await cacheService.get(CACHE_KEY);
    if (cached) return cached;

    // Source 1: Local comprehensive dataset (250 countries)
    try {
      if (fs.existsSync(LOCAL_COUNTRIES_FILE)) {
        const raw = JSON.parse(fs.readFileSync(LOCAL_COUNTRIES_FILE, 'utf-8'));
        if (Array.isArray(raw) && raw.length > 0) {
          const countries = raw.map(c => this.normalizeCountry(c));
          await cacheService.set(CACHE_KEY, countries, config.cache.countryTTL);
          return countries;
        }
      }
    } catch (e) {
      console.warn('Could not read local countries dataset:', e.message);
    }

    // Source 2: External REST Countries API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(
        `${config.restCountriesUrl}/all?fields=name,cca2,cca3,capital,region,subregion,population,area,languages,currencies,timezones,flags,coatOfArms,latlng,borders,independent,unMember,continents,maps,gini,demonyms`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const countries = data.map(c => this.normalizeCountry(c));
          await cacheService.set(CACHE_KEY, countries, config.cache.countryTTL);
          return countries;
        }
      }
    } catch {
      // Ignore API errors
    }

    // Source 3: Try MongoDB
    try {
      const dbCountries = await Country.find({}).lean();
      if (dbCountries.length > 0) {
        return dbCountries;
      }
    } catch {
      // DB also unavailable
    }

    // Source 4: Demo data fallback
    return this.getDemoCountries();
  },

  /**
   * Get a single country by code
   */
  async getCountryByCode(code) {
    const upperCode = code.toUpperCase();
    const cacheKey = COUNTRY_CACHE_KEY(upperCode);

    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    // Search in all countries
    const allCountries = await this.fetchAllCountries();
    if (allCountries && allCountries.length > 0) {
      const found = allCountries.find(c => 
        c.code === upperCode || 
        c.cca3 === upperCode || 
        c.name.toLowerCase() === code.toLowerCase()
      );
      if (found) {
        await cacheService.set(cacheKey, found, config.cache.countryTTL);
        return found;
      }
    }

    // Fallback: demo countries
    const demoCountry = this.getDemoCountries().find(c => 
      c.code === upperCode || c.name.toLowerCase() === code.toLowerCase()
    );
    if (demoCountry) return demoCountry;

    throw new Error(`Country not found: ${code}`);
  },

  /**
   * Fetch World Bank indicators for a country
   */
  async getCountryIndicators(code) {
    const cacheKey = `indicators:${code.toUpperCase()}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const indicators = {
      gdp: 'NY.GDP.MKTP.CD',
      gdpPerCapita: 'NY.GDP.PCAP.CD',
      gdpGrowth: 'NY.GDP.MKTP.KD.ZG',
      internetUsers: 'IT.NET.USER.ZS',
      lifeExpectancy: 'SP.DYN.LE00.IN',
      literacy: 'SE.ADT.LITR.ZS',
      unemployment: 'SL.UEM.TOTL.ZS',
      co2Emissions: 'EN.ATM.CO2E.PC',
      rdExpenditure: 'GB.XPD.RSDV.GD.ZS',
    };

    const result = {};

    try {
      const fetches = Object.entries(indicators).map(async ([key, indicator]) => {
        try {
          const res = await fetch(
            `${config.worldBankUrl}/country/${code}/indicator/${indicator}?format=json&per_page=5&date=2018:2024&mrv=1`
          );
          if (!res.ok) return;
          const data = await res.json();
          if (data[1] && data[1][0]) {
            const item = data[1][0];
            result[key] = { value: item.value, year: parseInt(item.date) };
          }
        } catch {
          // Individual indicator fetch failed — skip
        }
      });

      await Promise.allSettled(fetches);

      await cacheService.set(cacheKey, result, config.cache.worldBankTTL);

      // Update country record
      try {
        await Country.findOneAndUpdate(
          { code: code.toUpperCase() },
          { $set: { indicators: result, indicatorsUpdatedAt: new Date() } }
        );
      } catch { /* ignore */ }

      return result;
    } catch (error) {
      console.error(`Failed to fetch indicators for ${code}:`, error.message);
      return result;
    }
  },

  /**
   * Search countries
   */
  async searchCountries(query) {
    const allCountries = await this.fetchAllCountries();
    const q = query.toLowerCase();
    return allCountries.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.officialName && c.officialName.toLowerCase().includes(q)) ||
      (c.capital && c.capital.some(cap => cap.toLowerCase().includes(q))) ||
      c.region.toLowerCase().includes(q) ||
      (c.subregion && c.subregion.toLowerCase().includes(q)) ||
      c.code.toLowerCase() === q
    );
  },

  /**
   * Get countries by region
   */
  async getCountriesByRegion(region) {
    const allCountries = await this.fetchAllCountries();
    return allCountries.filter(c => c.region.toLowerCase() === region.toLowerCase());
  },

  /**
   * Normalize REST Countries API response
   */
  normalizeCountry(c) {
    const code = (c.cca2 || c.code || '').toUpperCase();
    const codeLower = code.toLowerCase();
    const flagPng = c.flags?.png || (codeLower ? `https://flagcdn.com/w320/${codeLower}.png` : '');
    const flagSvg = c.flags?.svg || (codeLower ? `https://flagcdn.com/${codeLower}.svg` : '');

    return {
      code,
      cca3: c.cca3 || code,
      name: c.name?.common || c.name || code,
      officialName: c.name?.official || c.officialName || c.name?.common || code,
      capital: Array.isArray(c.capital) ? c.capital : (c.capital ? [c.capital] : []),
      region: c.region || 'Unknown',
      subregion: c.subregion || '',
      population: c.population || 0,
      area: c.area || 0,
      languages: c.languages || {},
      currencies: c.currencies || {},
      timezones: c.timezones || [],
      flag: flagPng,
      flagSvg: flagSvg,
      coatOfArms: c.coatOfArms?.png || c.coatOfArms || '',
      latlng: c.latlng || [],
      borders: c.borders || [],
      independent: c.independent ?? true,
      unMember: c.unMember ?? false,
      continents: c.continents || [c.region || 'World'],
      maps: c.maps || {},
      gini: c.gini || {},
      demonyms: c.demonyms || {},
    };
  },

  /**
   * Demo countries for fallback
   */
  getDemoCountries() {
    return [
      { code: 'US', name: 'United States', officialName: 'United States of America', capital: ['Washington, D.C.'], region: 'Americas', subregion: 'North America', population: 331002651, area: 9833520, languages: { eng: 'English' }, currencies: { USD: { name: 'United States dollar', symbol: '$' } }, timezones: ['UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00', 'UTC-07:00', 'UTC-06:00', 'UTC-05:00', 'UTC-04:00'], flag: 'https://flagcdn.com/w320/us.png', flagSvg: 'https://flagcdn.com/us.svg', coatOfArms: '', latlng: [38, -97], borders: ['CAN', 'MEX'], independent: true, unMember: true, continents: ['North America'], maps: {}, gini: {}, demonyms: {} },
      { code: 'IN', name: 'India', officialName: 'Republic of India', capital: ['New Delhi'], region: 'Asia', subregion: 'Southern Asia', population: 1380004385, area: 3287263, languages: { eng: 'English', hin: 'Hindi' }, currencies: { INR: { name: 'Indian rupee', symbol: '₹' } }, timezones: ['UTC+05:30'], flag: 'https://flagcdn.com/w320/in.png', flagSvg: 'https://flagcdn.com/in.svg', coatOfArms: '', latlng: [20, 77], borders: ['BGD', 'BTN', 'MMR', 'CHN', 'NPL', 'PAK'], independent: true, unMember: true, continents: ['Asia'], maps: {}, gini: {}, demonyms: {} },
      { code: 'GB', name: 'United Kingdom', officialName: 'United Kingdom of Great Britain and Northern Ireland', capital: ['London'], region: 'Europe', subregion: 'Northern Europe', population: 67886011, area: 242900, languages: { eng: 'English' }, currencies: { GBP: { name: 'British pound', symbol: '£' } }, timezones: ['UTC+00:00'], flag: 'https://flagcdn.com/w320/gb.png', flagSvg: 'https://flagcdn.com/gb.svg', coatOfArms: '', latlng: [54, -2], borders: ['IRL'], independent: true, unMember: true, continents: ['Europe'], maps: {}, gini: {}, demonyms: {} },
      { code: 'DE', name: 'Germany', officialName: 'Federal Republic of Germany', capital: ['Berlin'], region: 'Europe', subregion: 'Western Europe', population: 83783942, area: 357114, languages: { deu: 'German' }, currencies: { EUR: { name: 'Euro', symbol: '€' } }, timezones: ['UTC+01:00'], flag: 'https://flagcdn.com/w320/de.png', flagSvg: 'https://flagcdn.com/de.svg', coatOfArms: '', latlng: [51, 9], borders: ['AUT', 'BEL', 'CZE', 'DNK', 'FRA', 'LUX', 'NLD', 'POL', 'CHE'], independent: true, unMember: true, continents: ['Europe'], maps: {}, gini: {}, demonyms: {} },
      { code: 'JP', name: 'Japan', officialName: 'Japan', capital: ['Tokyo'], region: 'Asia', subregion: 'Eastern Asia', population: 125836021, area: 377930, languages: { jpn: 'Japanese' }, currencies: { JPY: { name: 'Japanese yen', symbol: '¥' } }, timezones: ['UTC+09:00'], flag: 'https://flagcdn.com/w320/jp.png', flagSvg: 'https://flagcdn.com/jp.svg', coatOfArms: '', latlng: [36, 138], borders: [], independent: true, unMember: true, continents: ['Asia'], maps: {}, gini: {}, demonyms: {} },
      { code: 'BR', name: 'Brazil', officialName: 'Federative Republic of Brazil', capital: ['Brasília'], region: 'Americas', subregion: 'South America', population: 212559417, area: 8515767, languages: { por: 'Portuguese' }, currencies: { BRL: { name: 'Brazilian real', symbol: 'R$' } }, timezones: ['UTC-05:00', 'UTC-04:00', 'UTC-03:00', 'UTC-02:00'], flag: 'https://flagcdn.com/w320/br.png', flagSvg: 'https://flagcdn.com/br.svg', coatOfArms: '', latlng: [-10, -55], borders: ['ARG', 'BOL', 'COL', 'GUF', 'GUY', 'PRY', 'PER', 'SUR', 'URY', 'VEN'], independent: true, unMember: true, continents: ['South America'], maps: {}, gini: {}, demonyms: {} },
      { code: 'AU', name: 'Australia', officialName: 'Commonwealth of Australia', capital: ['Canberra'], region: 'Oceania', subregion: 'Australia and New Zealand', population: 25499884, area: 7692024, languages: { eng: 'English' }, currencies: { AUD: { name: 'Australian dollar', symbol: '$' } }, timezones: ['UTC+05:00', 'UTC+06:30', 'UTC+07:00', 'UTC+08:00', 'UTC+09:30', 'UTC+10:00', 'UTC+10:30', 'UTC+11:30'], flag: 'https://flagcdn.com/w320/au.png', flagSvg: 'https://flagcdn.com/au.svg', coatOfArms: '', latlng: [-27, 133], borders: [], independent: true, unMember: true, continents: ['Oceania'], maps: {}, gini: {}, demonyms: {} },
      { code: 'NG', name: 'Nigeria', officialName: 'Federal Republic of Nigeria', capital: ['Abuja'], region: 'Africa', subregion: 'Western Africa', population: 206139589, area: 923768, languages: { eng: 'English' }, currencies: { NGN: { name: 'Nigerian naira', symbol: '₦' } }, timezones: ['UTC+01:00'], flag: 'https://flagcdn.com/w320/ng.png', flagSvg: 'https://flagcdn.com/ng.svg', coatOfArms: '', latlng: [10, 8], borders: ['BEN', 'CMR', 'TCD', 'NER'], independent: true, unMember: true, continents: ['Africa'], maps: {}, gini: {}, demonyms: {} },
    ];
  },
};

export default countryService;
