import { AlertCircleIcon, SearchIcon, ArrowRightIcon } from './Icons.jsx';

/* Loading State */
export function LoadingState({ count = 3, type = 'card' }) {
  return (
    <div className={`grid ${type === 'card' ? 'grid-auto-fill' : ''}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card">
          {type === 'card' && <div className="skeleton skeleton-card" />}
          <div className="skeleton skeleton-title" style={{ width: `${60 + Math.random() * 30}%` }} />
          <div className="skeleton skeleton-text" style={{ width: `${80 + Math.random() * 20}%` }} />
          <div className="skeleton skeleton-text" style={{ width: `${50 + Math.random() * 30}%` }} />
        </div>
      ))}
    </div>
  );
}

/* Error State */
export function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="error-state">
      <div className="icon-box icon-box-error" style={{ width: 56, height: 56, margin: '0 auto var(--space-md)' }}>
        <AlertCircleIcon size={32} />
      </div>
      <p className="error-state-title">{message}</p>
      <p className="error-state-text">Please try again later or check your connection.</p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry} style={{ marginTop: 'var(--space-md)' }}>
          Try Again
        </button>
      )}
    </div>
  );
}

/* Empty State */
export function EmptyState({ title = 'No data available', message = '', icon = null }) {
  return (
    <div className="empty-state">
      <div className="icon-box icon-box-brand" style={{ width: 56, height: 56, margin: '0 auto var(--space-md)' }}>
        {icon ? (typeof icon === 'string' ? icon : icon) : <SearchIcon size={28} />}
      </div>
      <p className="empty-state-title">{title}</p>
      {message && <p className="empty-state-text">{message}</p>}
    </div>
  );
}


/* Section wrapper */
export function Section({ title, action, actionLabel = 'View all', children, id }) {
  return (
    <section className="section fade-in" id={id}>
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        {action && (
          <button className="section-action flex items-center gap-xs" onClick={action}>
            <span>{actionLabel}</span>
            <ArrowRightIcon size={14} />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

/* Filter Bar */
export function FilterBar({ filters, activeFilter, onFilter }) {
  return (
    <div className="filter-bar" role="tablist">
      <button
        className={`filter-chip ${!activeFilter ? 'active' : ''}`}
        onClick={() => onFilter(null)}
        role="tab"
        aria-selected={!activeFilter}
      >
        All
      </button>
      {filters.map((filter) => (
        <button
          key={filter.value || filter}
          className={`filter-chip ${activeFilter === (filter.value || filter) ? 'active' : ''}`}
          onClick={() => onFilter(filter.value || filter)}
          role="tab"
          aria-selected={activeFilter === (filter.value || filter)}
        >
          {filter.label || filter}
        </button>
      ))}
    </div>
  );
}

/* Pagination */
export function Pagination({ page, total, limit, onPageChange }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between" style={{ marginTop: 'var(--space-lg)' }}>
      <button
        className="btn btn-secondary btn-sm flex items-center gap-xs"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <span style={{ transform: 'rotate(180deg)', display: 'inline-flex' }}><ArrowRightIcon size={14} /></span>
        <span>Previous</span>
      </button>
      <span className="timestamp">Page {page} of {totalPages}</span>
      <button
        className="btn btn-secondary btn-sm flex items-center gap-xs"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <span>Next</span>
        <ArrowRightIcon size={14} />
      </button>
    </div>
  );
}

