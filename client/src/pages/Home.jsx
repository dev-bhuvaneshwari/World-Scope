import { useNavigate } from 'react-router-dom';
import { useFetch, formatNumber } from '../hooks/useData.js';
import { fetchCountryStats, fetchGlobalNews, fetchGlobalTech } from '../api/client.js';
import NewsCard from '../components/NewsCard.jsx';
import { Section, LoadingState } from '../components/Common.jsx';
import {
  GlobeIcon,
  DashboardIcon,
  NewspaperIcon,
  CpuIcon,
  RocketIcon,
  FlaskIcon,
  ScaleIcon,
  SearchIcon,
  StarIcon,
  ArrowRightIcon,
  UsersIcon,
  MapPinIcon,
} from '../components/Icons.jsx';
import './Home.css';

function HeroGlobeGraphic() {
  return (
    <div className="hero-graphic-container">
      <div className="hero-graphic-glow" />
      <svg className="hero-globe-svg" viewBox="0 0 240 240" width="240" height="240">
        <defs>
          <linearGradient id="globeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id="sphereGrad" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#312e81" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.6" />
          </radialGradient>
        </defs>

        {/* Outer Orbit Ring */}
        <ellipse cx="120" cy="120" rx="108" ry="38" fill="none" stroke="rgba(99, 102, 241, 0.35)" strokeWidth="1.5" strokeDasharray="4 6" className="spin-slow" />
        
        {/* Main Sphere Background */}
        <circle cx="120" cy="120" r="80" fill="url(#sphereGrad)" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="1.5" />
        
        {/* Longitude and Latitude Grid */}
        <ellipse cx="120" cy="120" rx="80" ry="28" fill="none" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1.2" />
        <ellipse cx="120" cy="120" rx="80" ry="58" fill="none" stroke="rgba(99, 102, 241, 0.25)" strokeWidth="1.2" />
        <ellipse cx="120" cy="120" rx="30" ry="80" fill="none" stroke="rgba(6, 182, 212, 0.35)" strokeWidth="1.2" />
        <ellipse cx="120" cy="120" rx="60" ry="80" fill="none" stroke="rgba(99, 102, 241, 0.25)" strokeWidth="1.2" />
        <line x1="40" y1="120" x2="200" y2="120" stroke="rgba(6, 182, 212, 0.45)" strokeWidth="1.5" />
        <line x1="120" y1="40" x2="120" y2="200" stroke="rgba(99, 102, 241, 0.45)" strokeWidth="1.5" />

        {/* Pulsing Data Nodes */}
        <circle cx="95" cy="100" r="4.5" fill="#38bdf8" className="pulse-node" />
        <circle cx="148" cy="88" r="4" fill="#a855f7" className="pulse-node-delayed" />
        <circle cx="130" cy="145" r="5" fill="#34d399" className="pulse-node" />
        <circle cx="80" cy="130" r="3.5" fill="#f59e0b" className="pulse-node-delayed" />
        <circle cx="165" cy="125" r="3.5" fill="#6366f1" className="pulse-node" />

        {/* Orbiting Satellite / Beacon */}
        <g className="spin-fast">
          <circle cx="120" cy="15" r="5" fill="#06b6d4" />
          <circle cx="120" cy="15" r="9" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { data: stats } = useFetch(fetchCountryStats, []);
  const { data: newsData } = useFetch(() => fetchGlobalNews({ limit: 6 }), []);
  const { data: techData } = useFetch(() => fetchGlobalTech({ limit: 4 }), []);

  return (
    <div className="home-page fade-in">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-pill mb-md">
            <span className="hero-pill-badge">Live Intelligence</span>
            <span className="hero-pill-text">Autonomous World Monitor</span>
          </div>
          <h1 className="hero-title">
            Explore the World.
            <span className="hero-title-highlight"> Understand What Matters.</span>
          </h1>
          <p className="hero-subtitle">
            WorldScope is an enterprise-grade global intelligence platform. Discover real-time news, 
            technology trends, emerging industries, startup ecosystems, and research breakthroughs 
            across every country — backed by verified public data.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg flex items-center gap-sm" onClick={() => navigate('/countries')}>
              <GlobeIcon size={20} />
              <span>Explore Countries</span>
            </button>
            <button className="btn btn-secondary btn-lg flex items-center gap-sm" onClick={() => navigate('/dashboard')}>
              <DashboardIcon size={20} />
              <span>View Global Trends</span>
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <HeroGlobeGraphic />
        </div>
      </section>

      {/* Global Stats */}
      {stats && (
        <section className="home-stats">
          <div className="home-stat">
            <span className="home-stat-value">{stats.data?.totalCountries || '—'}</span>
            <span className="home-stat-label">Countries Tracked</span>
          </div>
          <div className="home-stat">
            <span className="home-stat-value">{formatNumber(stats.data?.totalPopulation)}</span>
            <span className="home-stat-label">World Population</span>
          </div>
          <div className="home-stat">
            <span className="home-stat-value">{stats.data?.regions || '—'}</span>
            <span className="home-stat-label">Regions</span>
          </div>
          <div className="home-stat">
            <span className="home-stat-value">{stats.data?.continents || '—'}</span>
            <span className="home-stat-label">Continents</span>
          </div>
        </section>
      )}

      {/* Latest Global News */}
      <Section title="Latest Global News" action={() => navigate('/news')} actionLabel="View all news">
        {newsData?.articles?.length > 0 ? (
          <div className="grid grid-auto-fill">
            {newsData.articles.slice(0, 6).map((article, i) => (
              <NewsCard key={i} article={article} compact />
            ))}
          </div>
        ) : (
          <LoadingState count={3} />
        )}
      </Section>

      {/* Trending Technologies */}
      <Section title="Trending Technologies" action={() => navigate('/technology')} actionLabel="View all trends">
        {techData?.trends?.length > 0 ? (
          <div className="home-tech-grid">
            {techData.trends.slice(0, 8).map((trend, i) => (
              <div key={i} className="card home-tech-item fade-in">
                <span className="home-tech-name">{trend.name}</span>
                <span className="badge badge-accent">{trend.category}</span>
                {trend.stars && (
                  <span className="tech-card-stars flex items-center gap-xs">
                    <StarIcon size={14} className="star-icon" />
                    <span>{trend.stars?.toLocaleString()}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <LoadingState count={4} />
        )}
      </Section>

      {/* Quick Explore */}
      <section className="home-explore">
        <h2 className="section-title">Quick Intelligence Modules</h2>
        <div className="home-explore-grid">
          {[
            { path: '/news', Icon: NewspaperIcon, colorClass: 'icon-box-brand', label: 'News Explorer', desc: 'Browse real-time global news categorized by sector and country' },
            { path: '/technology', Icon: CpuIcon, colorClass: 'icon-box-accent', label: 'Technology Trends', desc: 'Track breakthroughs in AI, quantum, chips, and cloud' },
            { path: '/startups', Icon: RocketIcon, colorClass: 'icon-box-success', label: 'Startups & Innovation', desc: 'Discover fast-growing startups and funding rounds globally' },
            { path: '/research', Icon: FlaskIcon, colorClass: 'icon-box-warning', label: 'Research & Development', desc: 'Explore academic papers and scientific citations' },
            { path: '/compare', Icon: ScaleIcon, colorClass: 'icon-box-brand', label: 'Country Comparison', desc: 'Compare population, GDP, and tech indicators side-by-side' },
            { path: '/search', Icon: SearchIcon, colorClass: 'icon-box-accent', label: 'Global Intelligence Search', desc: 'Unified multi-source search across all indicators and news' },
          ].map((item) => {
            const Icon = item.Icon;
            return (
              <button key={item.path} className="card card-clickable home-explore-card" onClick={() => navigate(item.path)}>
                <div className={`icon-box ${item.colorClass}`} style={{ width: 44, height: 44, marginBottom: 'var(--space-xs)' }}>
                  <Icon size={22} />
                </div>
                <span className="home-explore-label">{item.label}</span>
                <span className="home-explore-desc">{item.desc}</span>
                <span className="home-explore-link flex items-center gap-xs">
                  <span>Open module</span>
                  <ArrowRightIcon size={14} />
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

