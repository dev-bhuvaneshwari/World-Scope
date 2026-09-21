import { useTheme } from '../context/ThemeContext.jsx';
import { useFetch } from '../hooks/useData.js';
import { healthCheck } from '../api/client.js';
import { MoonIcon, SunIcon } from '../components/Icons.jsx';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { data: health } = useFetch(healthCheck, []);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Settings & About</h1>
        <p className="page-subtitle">Application configuration and system information</p>
      </div>

      <div className="grid grid-2">
        {/* Theme */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>Appearance</h3>
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontWeight: 'var(--font-medium)' }}>Theme</p>
              <p className="timestamp">Current: {theme === 'dark' ? 'Dark' : 'Light'}</p>
            </div>
            <button className="btn btn-secondary flex items-center gap-xs" onClick={toggleTheme}>
              {theme === 'light' ? (
                <>
                  <MoonIcon size={16} />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <SunIcon size={16} />
                  <span>Light Mode</span>
                </>
              )}
            </button>
          </div>
        </div>


        {/* System Status */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>System Status</h3>
          <div className="flex flex-col gap-sm">
            <div className="flex items-center justify-between">
              <span>API Server</span>
              <span className={`badge ${health ? 'badge-success' : 'badge-error'}`}>
                {health ? '● Online' : '● Offline'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Version</span>
              <span className="timestamp">{health?.version || '1.0.0'}</span>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>About WorldScope</h3>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-md)' }}>
            WorldScope is an AI-powered global information platform that allows you to explore any country 
            and discover its latest news, technology trends, emerging industries, startups, research developments, 
            and other important updates through a clean, modern dashboard.
          </p>
          <h4 style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-sm)' }}>Data Sources</h4>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.25rem', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            <li>REST Countries API — Country metadata</li>
            <li>World Bank API — Economic indicators</li>
            <li>GDELT Project — Global news aggregation</li>
            <li>GitHub API — Technology trends</li>
            <li>Crossref — Academic research</li>
            <li>OpenAI API — AI-powered summaries (when configured)</li>
          </ul>
          <p style={{ marginTop: 'var(--space-md)', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
            WorldScope uses publicly available APIs and does not scrape websites. All data is sourced from 
            legitimate public data providers.
          </p>
        </div>
      </div>
    </div>
  );
}
