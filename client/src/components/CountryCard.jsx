import { useNavigate } from 'react-router-dom';
import { formatNumber, getLanguages, getCurrencies } from '../hooks/useData.js';
import './Cards.css';

export default function CountryCard({ country }) {
  const navigate = useNavigate();

  return (
    <article
      className="card card-clickable country-card fade-in"
      onClick={() => navigate(`/country/${country.code}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/country/${country.code}`)}
      aria-label={`View details for ${country.name}`}
    >
      <div className="country-card-flag">
        <img 
          src={country.flag || country.flagSvg} 
          alt={`Flag of ${country.name}`} 
          loading="lazy"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </div>
      <div className="country-card-info">
        <h3 className="country-card-name">{country.name}</h3>
        <p className="country-card-detail">
          <span className="country-card-label">Capital</span>
          <span>{country.capital?.[0] || 'N/A'}</span>
        </p>
        <p className="country-card-detail">
          <span className="country-card-label">Region</span>
          <span>{country.region}</span>
        </p>
        <p className="country-card-detail">
          <span className="country-card-label">Population</span>
          <span>{formatNumber(country.population)}</span>
        </p>
        <p className="country-card-detail">
          <span className="country-card-label">Languages</span>
          <span className="truncate">{getLanguages(country.languages)}</span>
        </p>
      </div>
      <div className="country-card-footer">
        <span className="badge badge-brand">{country.region}</span>
        {country.code && <span className="country-card-code">{country.code}</span>}
      </div>
    </article>
  );
}
