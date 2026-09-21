import { useState, useCallback } from 'react';
import { useFetch } from '../hooks/useData.js';
import { fetchGlobalResearch } from '../api/client.js';
import { ResearchCard } from '../components/TechCard.jsx';
import { LoadingState, ErrorState, EmptyState, FilterBar } from '../components/Common.jsx';
import { FlaskIcon } from '../components/Icons.jsx';

const FIELDS = ['Computer Science', 'Medicine', 'Engineering', 'Physics', 'Biology', 'Chemistry', 'Economics', 'Environmental Science', 'Materials Science', 'Neuroscience'];

export default function ResearchDevelopment() {
  const [field, setField] = useState(null);
  const [page, setPage] = useState(1);

  const { data, loading, error, refetch } = useFetch(
    useCallback(() => fetchGlobalResearch({ field, page, limit: 20 }), [field, page]),
    [field, page]
  );

  const papers = data?.papers || [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Research & Development</h1>
        <p className="page-subtitle">Academic research publications — powered by Crossref</p>
      </div>

      <FilterBar
        filters={FIELDS}
        activeFilter={field}
        onFilter={(f) => { setField(f); setPage(1); }}
      />

      {loading && <LoadingState count={6} />}
      {error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && papers.length === 0 && (
        <EmptyState title="No research found" message="Try a different field or check back later." icon={<FlaskIcon size={32} />} />
      )}

      {!loading && !error && papers.length > 0 && (
        <div className="grid grid-auto-fill">
          {papers.map((paper, i) => <ResearchCard key={i} paper={paper} />)}
        </div>
      )}
    </div>
  );
}
