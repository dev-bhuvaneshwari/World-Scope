import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useFetch, useDebounce } from '../hooks/useData.js';
import { globalSearch } from '../api/client.js';
import CountryCard from '../components/CountryCard.jsx';
import NewsCard from '../components/NewsCard.jsx';
import TechCard, { ResearchCard } from '../components/TechCard.jsx';
import { LoadingState, EmptyState, Section } from '../components/Common.jsx';
import { SearchIcon } from '../components/Icons.jsx';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 400);

  const { data, loading } = useFetch(
    useCallback(() => debouncedQuery.length >= 2 ? globalSearch(debouncedQuery) : Promise.resolve(null), [debouncedQuery]),
    [debouncedQuery]
  );

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const results = data?.data || {};
  const total = data?.total || 0;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Search</h1>
        <p className="page-subtitle">Search across countries, news, technologies, and research</p>
      </div>

      <input
        type="search"
        className="input"
        placeholder="Search anything — countries, news, technologies, research..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        style={{ maxWidth: 600, marginBottom: 'var(--space-xl)', fontSize: 'var(--text-lg)' }}
      />

      {loading && debouncedQuery && <LoadingState count={4} />}

      {!loading && debouncedQuery && total === 0 && (
        <EmptyState title={`No results for "${debouncedQuery}"`} message="Try different keywords or spelling." icon={<SearchIcon size={32} />} />
      )}


      {!loading && total > 0 && (
        <>
          <p className="page-subtitle" style={{ marginBottom: 'var(--space-xl)' }}>
            {total} result{total !== 1 ? 's' : ''} for "{debouncedQuery}"
          </p>

          {results.countries?.length > 0 && (
            <Section title={`Countries (${results.countries.length})`}>
              <div className="grid grid-auto-fill">
                {results.countries.slice(0, 6).map(c => <CountryCard key={c.code} country={c} />)}
              </div>
            </Section>
          )}

          {results.news?.length > 0 && (
            <Section title={`News (${results.news.length})`}>
              <div className="grid grid-auto-fill">
                {results.news.slice(0, 6).map((a, i) => <NewsCard key={i} article={a} compact />)}
              </div>
            </Section>
          )}

          {results.technologies?.length > 0 && (
            <Section title={`Technologies (${results.technologies.length})`}>
              <div className="grid grid-auto-fill">
                {results.technologies.slice(0, 6).map((t, i) => <TechCard key={i} item={t} />)}
              </div>
            </Section>
          )}

          {results.research?.length > 0 && (
            <Section title={`Research (${results.research.length})`}>
              <div className="grid grid-auto-fill">
                {results.research.slice(0, 6).map((p, i) => <ResearchCard key={i} paper={p} />)}
              </div>
            </Section>
          )}
        </>
      )}

      {!debouncedQuery && (
        <EmptyState title="Start searching" message="Enter a query above to search across all WorldScope data." icon={<SearchIcon size={32} />} />
      )}
    </div>
  );
}

