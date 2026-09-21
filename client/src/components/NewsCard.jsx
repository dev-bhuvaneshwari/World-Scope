import { timeAgo, getCategoryColor } from '../hooks/useData.js';
import { AlertCircleIcon, ExternalLinkIcon } from './Icons.jsx';
import './Cards.css';

export default function NewsCard({ article, compact = false }) {
  const categoryColor = getCategoryColor(article.category);

  return (
    <article className={`card news-card fade-in ${compact ? 'news-card-compact' : ''}`}>
      {!compact && article.imageUrl && (
        <div className="news-card-image">
          <img 
            src={article.imageUrl} 
            alt="" 
            loading="lazy"
            onError={(e) => { e.target.parentElement.style.display = 'none'; }}
          />
        </div>
      )}
      <div className="news-card-content">
        <div className="news-card-meta">
          <span 
            className="news-card-category" 
            style={{ color: categoryColor, backgroundColor: `${categoryColor}15` }}
          >
            {article.category || 'General'}
          </span>
          <span className="timestamp">{timeAgo(article.publishedAt)}</span>
        </div>
        <h3 className="news-card-title">
          {article.url && article.url !== '#demo' ? (
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              {article.title} <ExternalLinkIcon size={13} className="inline-icon" />
            </a>
          ) : (
            article.title
          )}
        </h3>
        {!compact && article.description && (
          <p className="news-card-desc">{article.description}</p>
        )}
        <div className="news-card-footer">
          <span className="news-card-source">{article.source || 'Unknown source'}</span>
          {article.countryName && (
            <span className="news-card-country">{article.countryName}</span>
          )}
        </div>
      </div>
      {article.isDemo && (
        <div className="demo-banner flex items-center gap-xs">
          <AlertCircleIcon size={14} />
          <span>Demo data — connect API sources for live information</span>
        </div>
      )}
    </article>
  );
}

