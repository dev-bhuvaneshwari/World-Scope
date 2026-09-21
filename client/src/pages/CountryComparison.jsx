import { useState, useCallback } from 'react';
import { useFetch, formatNumber, formatCurrency } from '../hooks/useData.js';
import { fetchCountries, compareCountries } from '../api/client.js';
import { LoadingState, ErrorState, EmptyState } from '../components/Common.jsx';
import { ScaleIcon } from '../components/Icons.jsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './CountryComparison.css';

const CHART_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

export default function CountryComparison() {
  const [selectedCodes, setSelectedCodes] = useState([]);
  const [searchInput, setSearchInput] = useState('');

  const { data: countriesData } = useFetch(fetchCountries, []);
  const allCountries = countriesData?.data || [];

  const { data: compData, loading, error } = useFetch(
    useCallback(() => selectedCodes.length >= 2 ? compareCountries(selectedCodes) : Promise.resolve(null), [selectedCodes]),
    [selectedCodes],
  );

  const compared = compData?.data || [];

  const filteredCountries = searchInput.length > 0
    ? allCountries.filter(c =>
        c.name.toLowerCase().includes(searchInput.toLowerCase()) &&
        !selectedCodes.includes(c.code)
      ).slice(0, 8)
    : [];

  const addCountry = (code) => {
    if (selectedCodes.length < 5 && !selectedCodes.includes(code)) {
      setSelectedCodes(prev => [...prev, code]);
      setSearchInput('');
    }
  };

  const removeCountry = (code) => {
    setSelectedCodes(prev => prev.filter(c => c !== code));
  };

  // Prepare comparison data
  const popData = compared.map(c => ({ name: c.name, Population: c.population }));
  const gdpData = compared.filter(c => c.indicators?.gdp?.value).map(c => ({
    name: c.name,
    'GDP (Billion $)': Math.round((c.indicators.gdp.value || 0) / 1e9),
  }));
  const lifeData = compared.filter(c => c.indicators?.lifeExpectancy?.value).map(c => ({
    name: c.name,
    'Life Expectancy': c.indicators.lifeExpectancy.value,
  }));
  const internetData = compared.filter(c => c.indicators?.internetUsers?.value).map(c => ({
    name: c.name,
    'Internet Users %': Math.round(c.indicators.internetUsers.value * 10) / 10,
  }));

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Country Comparison</h1>
        <p className="page-subtitle">Compare up to 5 countries across key indicators</p>
      </div>

      {/* Country Selector */}
      <div className="comparison-selector">
        <div className="comparison-selected">
          {selectedCodes.map(code => {
            const country = allCountries.find(c => c.code === code);
            return (
              <div key={code} className="comparison-tag">
                <img src={country?.flag} alt="" width="20" height="14" />
                <span>{country?.name || code}</span>
                <button onClick={() => removeCountry(code)} aria-label={`Remove ${country?.name}`}>×</button>
              </div>
            );
          })}
        </div>
        {selectedCodes.length < 5 && (
          <div className="comparison-search-wrap">
            <input
              type="search"
              className="input"
              placeholder="Search countries to add..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ maxWidth: 350 }}
            />
            {filteredCountries.length > 0 && (
              <div className="comparison-dropdown">
                {filteredCountries.map(c => (
                  <button key={c.code} className="comparison-dropdown-item" onClick={() => addCountry(c.code)}>
                    <img src={c.flag} alt="" width="20" height="14" />
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedCodes.length < 2 && (
        <EmptyState
          title="Select at least 2 countries"
          message="Search and add countries above to begin comparison."
          icon={<ScaleIcon size={30} />}
        />
      )}


      {loading && <LoadingState count={4} />}
      {error && <ErrorState message={error} />}

      {compared.length >= 2 && (
        <div className="comparison-results">
          {/* Data Table */}
          <div className="card comparison-table-wrap">
            <h3 className="card-title">Key Indicators</h3>
            <div className="comparison-table-scroll">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Indicator</th>
                    {compared.map(c => <th key={c.code}>{c.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Population</td>
                    {compared.map(c => <td key={c.code}>{formatNumber(c.population)}</td>)}
                  </tr>
                  <tr>
                    <td>GDP</td>
                    {compared.map(c => <td key={c.code}>{formatCurrency(c.indicators?.gdp?.value)}</td>)}
                  </tr>
                  <tr>
                    <td>GDP per Capita</td>
                    {compared.map(c => <td key={c.code}>{formatCurrency(c.indicators?.gdpPerCapita?.value)}</td>)}
                  </tr>
                  <tr>
                    <td>Internet Users</td>
                    {compared.map(c => <td key={c.code}>{c.indicators?.internetUsers?.value ? `${c.indicators.internetUsers.value.toFixed(1)}%` : 'N/A'}</td>)}
                  </tr>
                  <tr>
                    <td>Life Expectancy</td>
                    {compared.map(c => <td key={c.code}>{c.indicators?.lifeExpectancy?.value ? `${c.indicators.lifeExpectancy.value.toFixed(1)} years` : 'N/A'}</td>)}
                  </tr>
                  <tr>
                    <td>Unemployment</td>
                    {compared.map(c => <td key={c.code}>{c.indicators?.unemployment?.value ? `${c.indicators.unemployment.value.toFixed(1)}%` : 'N/A'}</td>)}
                  </tr>
                  <tr>
                    <td>R&D Expenditure</td>
                    {compared.map(c => <td key={c.code}>{c.indicators?.rdExpenditure?.value ? `${c.indicators.rdExpenditure.value.toFixed(2)}%` : 'N/A'}</td>)}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-2">
            {popData.length > 0 && (
              <div className="card">
                <h3 className="card-title">Population Comparison</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={popData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={v => formatNumber(v)} />
                    <Tooltip formatter={v => formatNumber(v)} />
                    <Bar dataKey="Population" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {gdpData.length > 0 && (
              <div className="card">
                <h3 className="card-title">GDP Comparison</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={gdpData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="GDP (Billion $)" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {lifeData.length > 0 && (
              <div className="card">
                <h3 className="card-title">Life Expectancy</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={lifeData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 90]} />
                    <Tooltip />
                    <Bar dataKey="Life Expectancy" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {internetData.length > 0 && (
              <div className="card">
                <h3 className="card-title">Internet Users %</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={internetData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="Internet Users %" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
