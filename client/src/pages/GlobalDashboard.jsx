import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFetch, formatNumber } from '../hooks/useData.js';
import { fetchCountryStats, fetchRegions, fetchGlobalNews, fetchGlobalTech, fetchGlobalStartups, fetchGlobalResearch } from '../api/client.js';
import NewsCard from '../components/NewsCard.jsx';
import TechCard, { ResearchCard, StartupCard, StatCard } from '../components/TechCard.jsx';
import { Section, LoadingState, EmptyState } from '../components/Common.jsx';
import { GlobeIcon, UsersIcon, MapIcon, NewspaperIcon, RocketIcon, FlaskIcon } from '../components/Icons.jsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const CHART_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#f97316'];

export default function GlobalDashboard() {
  const navigate = useNavigate();

  const { data: stats } = useFetch(fetchCountryStats, []);
  const { data: regions } = useFetch(fetchRegions, []);
  const { data: newsData } = useFetch(useCallback(() => fetchGlobalNews({ limit: 8 }), []), []);
  const { data: techData } = useFetch(useCallback(() => fetchGlobalTech({ limit: 12 }), []), []);
  const { data: startupData } = useFetch(useCallback(() => fetchGlobalStartups({ limit: 6 }), []), []);
  const { data: researchData } = useFetch(useCallback(() => fetchGlobalResearch({ limit: 6 }), []), []);

  const regionData = regions?.data || [];
  const news = newsData?.articles || [];
  const techs = techData?.trends || [];
  const startups = startupData?.startups || [];
  const research = researchData?.papers || [];

  // News category distribution
  const newsCatData = news.reduce((acc, a) => {
    const cat = a.category || 'general';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(newsCatData).map(([name, value]) => ({ name, value }));

  // Tech category distribution
  const techCatData = techs.reduce((acc, t) => {
    const cat = t.category || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const techBarData = Object.entries(techCatData).map(([name, count]) => ({ name, count }));

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Global Dashboard</h1>
        <p className="page-subtitle">Worldwide intelligence overview — latest available data</p>
      </div>

      {/* Global Stats */}
      <section className="grid grid-4" style={{ marginBottom: 'var(--space-2xl)' }}>
        <StatCard label="Countries Tracked" value={stats?.data?.totalCountries || '—'} icon={<GlobeIcon size={18} />} />
        <StatCard label="World Population" value={formatNumber(stats?.data?.totalPopulation)} icon={<UsersIcon size={18} />} />
        <StatCard label="Regions" value={stats?.data?.regions || '—'} icon={<MapIcon size={18} />} />
        <StatCard label="Articles Today" value={news.length > 0 ? `${news.length}+` : '—'} icon={<NewspaperIcon size={18} />} />
      </section>


      {/* Charts Row */}
      <div className="grid grid-2" style={{ marginBottom: 'var(--space-2xl)' }}>
        {regionData.length > 0 && (
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>Countries by Region</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={regionData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--color-brand)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {pieData.length > 0 && (
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>News Category Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name }) => name}>
                  {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tech categories chart */}
      {techBarData.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-2xl)' }}>
          <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>Technology Categories</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={techBarData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Latest News */}
      <Section title="Latest News" action={() => navigate('/news')}>
        {news.length > 0 ? (
          <div className="grid grid-auto-fill">
            {news.slice(0, 6).map((a, i) => <NewsCard key={i} article={a} compact />)}
          </div>
        ) : <LoadingState count={3} />}
      </Section>

      {/* Technology Trends */}
      <Section title="Trending Technologies" action={() => navigate('/technology')}>
        {techs.length > 0 ? (
          <div className="grid grid-auto-fill">
            {techs.slice(0, 6).map((t, i) => <TechCard key={i} item={t} />)}
          </div>
        ) : <LoadingState count={3} />}
      </Section>

      {/* Startups */}
      <Section title="Startup Activity" action={() => navigate('/startups')}>
        {startups.length > 0 ? (
          <div className="grid grid-auto-fill">
            {startups.slice(0, 4).map((s, i) => <StartupCard key={i} startup={s} />)}
          </div>
        ) : <EmptyState title="No startup data available" icon={<RocketIcon size={28} />} />}
      </Section>

      {/* Research */}
      <Section title="Research & Innovation" action={() => navigate('/research')}>
        {research.length > 0 ? (
          <div className="grid grid-auto-fill">
            {research.slice(0, 4).map((p, i) => <ResearchCard key={i} paper={p} />)}
          </div>
        ) : <EmptyState title="No research data available" icon={<FlaskIcon size={28} />} />}
      </Section>
    </div>
  );
}

