import { useState, useCallback } from 'react';
import { useFetch } from '../hooks/useData.js';
import { fetchGlobalNews } from '../api/client.js';
import NewsCard from '../components/NewsCard.jsx';
import { LoadingState, ErrorState, EmptyState, FilterBar } from '../components/Common.jsx';
import { NewspaperIcon, AlertCircleIcon } from '../components/Icons.jsx';

const CATEGORIES = ['politics', 'economy', 'technology', 'science', 'business', 'startups', 'education', 'health', 'environment'];

export default function NewsExplorer() {
  const [category, setCategory] = useState(null);
  const [page, setPage] = useState(1);

  const { data, loading, error, refetch } = useFetch(
    useCallback(() => fetchGlobalNews({ category, page, limit: 20 }), [category, page]),
    [category, page]
  );

  const articles = data?.articles || [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">News Explorer</h1>
        <p className="page-subtitle">Real-time global news coverage across categories</p>
      </div>

      <FilterBar filters={CATEGORIES} activeFilter={category} onFilter={(c) => { setCategory(c); setPage(1); }} />

      {loading && <LoadingState count={6} />}
      {error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && articles.length === 0 && (
        <EmptyState title="No news found" message="Try selecting a different category or check back later." icon={<NewspaperIcon size={32} />} />
      )}
      {!loading && !error && articles.length > 0 && (
        <>
          {data?.isDemo && (
            <div className="demo-banner flex items-center gap-xs" style={{ marginBottom: 'var(--space-lg)' }}>
              <AlertCircleIcon size={14} />
              <span>Demo data — connect API sources for live information</span>
            </div>
          )}
          <div className="grid grid-auto-fill">
            {articles.map((article, i) => (
              <NewsCard key={i} article={article} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

