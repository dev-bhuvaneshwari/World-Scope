import { useState, useCallback } from 'react';
import { useFetch, useDebounce } from '../hooks/useData.js';
import { fetchCountries, fetchRegions } from '../api/client.js';
import CountryCard from '../components/CountryCard.jsx';
import { LoadingState, ErrorState, EmptyState, FilterBar } from '../components/Common.jsx';
import { GlobeIcon } from '../components/Icons.jsx';

export default function CountryExplorer() {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState(null);
  const debouncedSearch = useDebounce(search, 300);

  const { data: regionsData } = useFetch(fetchRegions, []);
  const { data, loading, error, refetch } = useFetch(
    useCallback(() => {
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (region) params.region = region;
      return fetchCountries(params);
    }, [debouncedSearch, region]),
    [debouncedSearch, region]
  );

  const countries = data?.data || [];
  const regions = regionsData?.data || [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Country Explorer</h1>
        <p className="page-subtitle">
          Search and discover {countries.length > 0 ? `${countries.length} ` : ''}countries worldwide
        </p>
      </div>

      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <input
          type="search"
          className="input"
          placeholder="Search by country name, capital, or region..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search countries"
          style={{ maxWidth: 500 }}
        />
      </div>

      {regions.length > 0 && (
        <FilterBar
          filters={regions.map(r => ({ value: r.name, label: `${r.name} (${r.count})` }))}
          activeFilter={region}
          onFilter={setRegion}
        />
      )}

      {loading && <LoadingState count={8} />}
      {error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && countries.length === 0 && (
        <EmptyState
          title="No countries found"
          message={search ? `No results for "${search}"` : 'Try adjusting your filters'}
          icon={<GlobeIcon size={32} />}
        />
      )}

      {!loading && !error && countries.length > 0 && (
        <div className="grid grid-auto-fill">
          {countries.map((country) => (
            <CountryCard key={country.code} country={country} />
          ))}
        </div>
      )}
    </div>
  );
}
