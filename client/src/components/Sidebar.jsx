import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';
import {
  HomeIcon,
  DashboardIcon,
  GlobeIcon,
  NewspaperIcon,
  CpuIcon,
  RocketIcon,
  FlaskIcon,
  ScaleIcon,
  SearchIcon,
  SettingsIcon,
  SunIcon,
  MoonIcon,
} from './Icons.jsx';
import './Sidebar.css';

const navItems = [
  { path: '/', label: 'Home', Icon: HomeIcon },
  { path: '/dashboard', label: 'Global Dashboard', Icon: DashboardIcon },
  { path: '/countries', label: 'Country Explorer', Icon: GlobeIcon },
  { path: '/news', label: 'News Explorer', Icon: NewspaperIcon },
  { path: '/technology', label: 'Technology Trends', Icon: CpuIcon },
  { path: '/startups', label: 'Startups & Innovation', Icon: RocketIcon },
  { path: '/research', label: 'Research & Development', Icon: FlaskIcon },
  { path: '/compare', label: 'Country Comparison', Icon: ScaleIcon },
  { path: '/search', label: 'Search', Icon: SearchIcon },
  { path: '/settings', label: 'Settings', Icon: SettingsIcon },
];

export default function Sidebar({ isOpen, onClose }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />}
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`} role="navigation" aria-label="Main navigation">
        <div className="sidebar-header">
          <NavLink to="/" className="sidebar-brand" onClick={onClose}>
            <div className="sidebar-logo-box">
              <GlobeIcon size={22} className="sidebar-logo-svg" />
            </div>
            <div>
              <span className="sidebar-brand-name">WorldScope</span>
              <span className="sidebar-brand-tagline">Global Intelligence</span>
            </div>
          </NavLink>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.Icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
                end={item.path === '/'}
              >
                <span className="sidebar-link-icon">
                  <Icon size={18} />
                </span>
                <span className="sidebar-link-label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            <span className="sidebar-link-icon">
              {theme === 'light' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
            </span>
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}

