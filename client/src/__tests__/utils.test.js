import { describe, it, expect } from 'vitest';
import { formatNumber, formatCurrency, timeAgo, getCategoryColor, getLanguages, getCurrencies } from '../hooks/useData.js';

describe('formatNumber', () => {
  it('formats billions', () => {
    expect(formatNumber(1380000000)).toBe('1.38B');
  });

  it('formats millions', () => {
    expect(formatNumber(67000000)).toBe('67.0M');
  });

  it('formats thousands', () => {
    expect(formatNumber(5000)).toBe('5.0K');
  });

  it('handles null', () => {
    expect(formatNumber(null)).toBe('N/A');
  });

  it('handles undefined', () => {
    expect(formatNumber(undefined)).toBe('N/A');
  });

  it('handles small numbers', () => {
    expect(formatNumber(42)).toBe('42');
  });
});

describe('formatCurrency', () => {
  it('formats trillions', () => {
    expect(formatCurrency(2.5e12)).toBe('$2.50T');
  });

  it('formats billions', () => {
    expect(formatCurrency(3.2e9)).toBe('$3.20B');
  });

  it('handles null', () => {
    expect(formatCurrency(null)).toBe('N/A');
  });
});

describe('timeAgo', () => {
  it('returns "Just now" for recent dates', () => {
    expect(timeAgo(new Date())).toBe('Just now');
  });

  it('returns minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(timeAgo(fiveMinAgo)).toBe('5m ago');
  });

  it('returns hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(timeAgo(twoHoursAgo)).toBe('2h ago');
  });

  it('returns empty string for null', () => {
    expect(timeAgo(null)).toBe('');
  });
});

describe('getCategoryColor', () => {
  it('returns correct color for technology', () => {
    expect(getCategoryColor('technology')).toBe('#6366f1');
  });

  it('returns default color for unknown', () => {
    expect(getCategoryColor('unknown')).toBe('#64748b');
  });

  it('handles null', () => {
    expect(getCategoryColor(null)).toBe('#64748b');
  });
});

describe('getLanguages', () => {
  it('formats language object', () => {
    expect(getLanguages({ eng: 'English', hin: 'Hindi' })).toBe('English, Hindi');
  });

  it('handles null', () => {
    expect(getLanguages(null)).toBe('N/A');
  });

  it('limits to 3 languages', () => {
    const langs = { a: 'A', b: 'B', c: 'C', d: 'D', e: 'E' };
    const result = getLanguages(langs);
    expect(result).toContain('+2');
  });
});

describe('getCurrencies', () => {
  it('formats currency object', () => {
    const result = getCurrencies({ USD: { name: 'US Dollar', symbol: '$' } });
    expect(result).toContain('US Dollar');
    expect(result).toContain('$');
  });

  it('handles null', () => {
    expect(getCurrencies(null)).toBe('N/A');
  });
});
