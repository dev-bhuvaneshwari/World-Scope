import { useState, useCallback } from 'react';
import { useFetch } from '../hooks/useData.js';
import { fetchGlobalStartups } from '../api/client.js';
import { StartupCard } from '../components/TechCard.jsx';
import { LoadingState, ErrorState, EmptyState, FilterBar } from '../components/Common.jsx';
import { RocketIcon } from '../components/Icons.jsx';

const SECTORS = ['AI', 'FinTech', 'HealthTech', 'EdTech', 'CleanTech', 'Renewable Energy', 'Space', 'Cybersecurity', 'SaaS', 'E-commerce', 'Robotics', 'AgriTech'];

export default function StartupsInnovation() {
  const [sector, setSector] = useState(null);

  const { data, loading, error, refetch } = useFetch(
    useCallback(() => fetchGlobalStartups({ sector, limit: 20 }), [sector]),
    [sector]
  );

  const startups = data?.startups || [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Startups & Innovation</h1>
        <p className="page-subtitle">Global startup ecosystem activity — derived from news sources</p>
      </div>

      <FilterBar filters={SECTORS} activeFilter={sector} onFilter={setSector} />

      {loading && <LoadingState count={6} />}
      {error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && startups.length === 0 && (
        <EmptyState
          title="Startup data is currently unavailable"
          message="Startup data is currently unavailable from connected sources. Try adjusting filters or check back later."
          icon={<RocketIcon size={32} />}
        />
      )}

      {!loading && !error && startups.length > 0 && (
        <div className="grid grid-auto-fill">
          {startups.map((s, i) => <StartupCard key={i} startup={s} />)}
        </div>
      )}
    </div>
  );
}
