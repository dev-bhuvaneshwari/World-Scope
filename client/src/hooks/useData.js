import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Generic data fetching hook
 */
export function useFetch(fetchFn, deps = [], options = {}) {
  const { immediate = true } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn(...args);
      if (mountedRef.current) {
        setData(result);
        setLoading(false);
      }
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'An error occurred');
        setLoading(false);
      }
    }
  }, [fetchFn]);

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) execute();
    return () => { mountedRef.current = false; };
  }, deps);

  return { data, loading, error, refetch: execute };
}

/**
 * Debounce hook
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Format number with locale
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return 'N/A';
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toLocaleString();
}

/**
 * Format currency
 */
export function formatCurrency(num) {
  if (num === null || num === undefined) return 'N/A';
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  return `$${num.toLocaleString()}`;
}

/**
 * Relative time ago
 */
export function timeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now - d) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Get category color
 */
export function getCategoryColor(category) {
  const colors = {
    politics: '#8b5cf6', economy: '#10b981', technology: '#6366f1',
    science: '#06b6d4', business: '#f59e0b', startups: '#ec4899',
    education: '#8b5cf6', health: '#ef4444', environment: '#22c55e',
    general: '#64748b',
  };
  return colors[category?.toLowerCase()] || colors.general;
}

/**
 * Get languages string from object
 */
export function getLanguages(langObj) {
  if (!langObj) return 'N/A';
  const values = typeof langObj === 'object' ? Object.values(langObj) : [langObj];
  return values.slice(0, 3).join(', ') + (values.length > 3 ? ` +${values.length - 3}` : '');
}

/**
 * Get currency string from object
 */
export function getCurrencies(currObj) {
  if (!currObj) return 'N/A';
  const entries = typeof currObj === 'object' ? Object.values(currObj) : [currObj];
  return entries.map(c => `${c.name || c} ${c.symbol ? `(${c.symbol})` : ''}`).slice(0, 2).join(', ');
}
