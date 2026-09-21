import { timeAgo } from '../hooks/useData.js';
import {
  BotIcon,
  CloudIcon,
  ShieldCheckIcon,
  CpuIcon,
  GlobeIcon,
  AtomIcon,
  RadioIcon,
  RocketIcon,
  CurrencyDollarIcon,
  LightbulbIcon,
  StarIcon,
  MapPinIcon,
  AcademicCapIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ExternalLinkIcon,
} from './Icons.jsx';
import './Cards.css';

const CATEGORY_ICONS = {
  ai: BotIcon,
  cloud: CloudIcon,
  cybersecurity: ShieldCheckIcon,
  robotics: BotIcon,
  semiconductors: CpuIcon,
  web: GlobeIcon,
  mobile: RadioIcon,
  quantum: AtomIcon,
  biotech: AtomIcon,
  'renewable-energy': LightbulbIcon,
  space: RocketIcon,
  fintech: CurrencyDollarIcon,
  blockchain: ShieldCheckIcon,
  iot: RadioIcon,
  other: LightbulbIcon,
};

export default function TechCard({ item }) {
  const IconComponent = CATEGORY_ICONS[item.category] || LightbulbIcon;

  return (
    <article className="card tech-card fade-in">
      <div className="tech-card-header">
        <span className="icon-box icon-box-accent">
          <IconComponent size={18} />
        </span>
        <div>
          <h3 className="tech-card-name">{item.name}</h3>
          <span className="badge badge-accent">{item.category}</span>
        </div>
      </div>
      {item.description && (
        <p className="tech-card-desc">{item.description}</p>
      )}
      <div className="tech-card-footer">
        <span className="news-card-source">{item.source || 'Unknown'}</span>
        <span className="timestamp">{timeAgo(item.publishedAt)}</span>
      </div>
      {item.url && item.url !== '#demo' && (
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="tech-card-link">
          View source <ExternalLinkIcon size={12} className="inline-icon" />
        </a>
      )}
      {item.stars !== undefined && (
        <span className="tech-card-stars">
          <StarIcon size={14} className="star-icon" /> {item.stars?.toLocaleString()}
        </span>
      )}
    </article>
  );
}

export function ResearchCard({ paper }) {
  return (
    <article className="card research-card fade-in">
      <div className="research-card-field">
        <span className="badge badge-info">{paper.field || 'Research'}</span>
        <span className="timestamp">{timeAgo(paper.publishedAt)}</span>
      </div>
      <h3 className="research-card-title">
        {paper.url && paper.url !== '#demo' ? (
          <a href={paper.url} target="_blank" rel="noopener noreferrer">
            {paper.title} <ExternalLinkIcon size={14} className="inline-icon" />
          </a>
        ) : (
          paper.title
        )}
      </h3>
      {paper.authors?.length > 0 && (
        <p className="research-card-authors">{paper.authors.join(', ')}</p>
      )}
      {paper.journal && (
        <p className="research-card-journal">{paper.journal}</p>
      )}
      {paper.abstract && (
        <p className="research-card-abstract">{paper.abstract.substring(0, 200)}...</p>
      )}
      {paper.citationCount > 0 && (
        <span className="research-card-citations">
          <AcademicCapIcon size={14} className="inline-icon" /> {paper.citationCount} citations
        </span>
      )}
    </article>
  );
}

export function StartupCard({ startup }) {
  return (
    <article className="card startup-card fade-in">
      <div className="startup-card-header">
        <h3 className="startup-card-name">{startup.name}</h3>
        <span className="badge badge-brand">{startup.sector || 'Other'}</span>
      </div>
      {startup.description && (
        <p className="startup-card-desc">{startup.description}</p>
      )}
      <div className="startup-card-meta">
        {startup.countryName && (
          <span className="flex items-center gap-xs">
            <MapPinIcon size={13} className="text-secondary" /> {startup.countryName}
          </span>
        )}
        {startup.funding && (
          <span className="flex items-center gap-xs">
            <CurrencyDollarIcon size={13} className="text-success" /> {startup.funding}
          </span>
        )}
        {startup.activity && <span className="timestamp">{startup.activity}</span>}
      </div>
      {startup.url && startup.url !== '#demo' && (
        <a href={startup.url} target="_blank" rel="noopener noreferrer" className="tech-card-link">
          View source <ExternalLinkIcon size={12} className="inline-icon" />
        </a>
      )}
    </article>
  );
}

export function StatCard({ label, value, icon, change, className = '' }) {
  return (
    <div className={`card stat-card ${className}`}>
      <div className="stat-card-header">
        {icon && (
          <span className="stat-card-icon icon-box icon-box-brand">
            {typeof icon === 'string' ? icon : icon}
          </span>
        )}
        <span className="stat-label">{label}</span>
      </div>
      <span className="stat-value">{value || 'N/A'}</span>
      {change && (
        <span className={`stat-change ${change > 0 ? 'positive' : 'negative'}`}>
          {change > 0 ? <TrendingUpIcon size={14} /> : <TrendingDownIcon size={14} />} {Math.abs(change)}%
        </span>
      )}
    </div>
  );
}

