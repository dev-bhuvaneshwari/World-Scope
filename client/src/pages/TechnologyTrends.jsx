import { useState, useCallback } from 'react';
import { useFetch } from '../hooks/useData.js';
import { fetchGlobalTech } from '../api/client.js';
import TechCard from '../components/TechCard.jsx';
import { LoadingState, ErrorState, EmptyState, FilterBar } from '../components/Common.jsx';
import { CpuIcon } from '../components/Icons.jsx';

const CATEGORIES = ['ai', 'cloud', 'cybersecurity', 'robotics', 'semiconductors', 'web', 'mobile', 'quantum', 'biotech', 'renewable-energy', 'space', 'fintech'];

export default function TechnologyTrends() {
  const [category, setCategory] = useState(null);

  const { data, loading, error, refetch } = useFetch(
    useCallback(() => fetchGlobalTech({ category, limit: 30 }), [category]),
    [category]
  );

  const trends = data?.trends || [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Technology Trends</h1>
        <p className="page-subtitle">Track emerging technologies worldwide — powered by GitHub & GDELT</p>
      </div>

      <FilterBar
        filters={CATEGORIES.map(c => ({ value: c, label: c.replace('-', ' ') }))}
        activeFilter={category}
        onFilter={setCategory}
      />

      {loading && <LoadingState count={6} />}
      {error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && trends.length === 0 && (
        <EmptyState title="No technology trends found" message="Try a different category" icon={<CpuIcon size={32} />} />
      )}

      {!loading && !error && trends.length > 0 && (
        <div className="grid grid-auto-fill">
          {trends.map((trend, i) => (
            <TechCard key={i} item={trend} />
          ))}
        </div>
      )}
    </div>
  );
}
