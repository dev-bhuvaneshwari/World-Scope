import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../hooks/useData.js';
import './Navbar.css';

export default function Navbar({ onMenuClick }) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  }, [searchQuery, navigate]);

  return (
    <header className="app-navbar" role="banner">
      <button className="navbar-menu-btn" onClick={onMenuClick} aria-label="Toggle menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <form className="navbar-search" onSubmit={handleSearch} role="search">
        <svg className="navbar-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="search"
          className="navbar-search-input"
          placeholder="Search countries, news, technologies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Global search"
        />
      </form>

      <div className="navbar-actions">
        <span className="navbar-status" title="System status">
          <span className="navbar-status-dot" />
          <span className="navbar-status-text">Live</span>
        </span>
      </div>
    </header>
  );
}
