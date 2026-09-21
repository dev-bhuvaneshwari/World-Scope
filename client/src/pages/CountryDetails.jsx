import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useFetch, formatNumber, formatCurrency, getLanguages, getCurrencies, timeAgo } from '../hooks/useData.js';
import { fetchCountry, fetchCountryIndicators, fetchCountryNews, fetchCountryTech, fetchCountryStartups, fetchCountryResearch, fetchCountrySummary } from '../api/client.js';
import NewsCard from '../components/NewsCard.jsx';
import TechCard, { ResearchCard, StartupCard, StatCard } from '../components/TechCard.jsx';
import { Section, LoadingState, ErrorState, EmptyState, FilterBar } from '../components/Common.jsx';
import {
  MapPinIcon,
  GlobeIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChatBubbleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  HeartIcon,
  WifiIcon,
  ActivityIcon,
  FlaskIcon,
  SparklesIcon,
  AlertCircleIcon,
  BotIcon,
  NewspaperIcon,
  CpuIcon,
  RocketIcon,
} from '../components/Icons.jsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './CountryDetails.css';

const CHART_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'];

export default function CountryDetails() {
  const { code } = useParams();
  const [newsCategory, setNewsCategory] = useState(null);

  const { data: countryData, loading: countryLoading, error: countryError } = useFetch(
    useCallback(() => fetchCountry(code), [code]), [code]
  );

  const { data: indicators } = useFetch(
    useCallback(() => fetchCountryIndicators(code), [code]), [code]
  );

  // Trigger data fetches once country data is loaded
  const country = countryData?.data;
  const countryName = country?.name;

  const { data: newsData, loading: newsLoading } = useFetch(
    useCallback(() => countryName ? fetchCountryNews(code, { countryName, category: newsCategory, limit: 12 }) : Promise.resolve(null), [code, countryName, newsCategory]),
    [code, countryName, newsCategory]
  );

  const { data: techResult } = useFetch(
    useCallback(() => countryName ? fetchCountryTech(code, { countryName }) : Promise.resolve(null), [code, countryName]),
    [code, countryName]
  );

  const { data: startupResult } = useFetch(
    useCallback(() => countryName ? fetchCountryStartups(code, { countryName }) : Promise.resolve(null), [code, countryName]),
    [code, countryName]
  );

  const { data: researchResult } = useFetch(
    useCallback(() => countryName ? fetchCountryResearch(code, { countryName }) : Promise.resolve(null), [code, countryName]),
    [code, countryName]
  );

  const { data: summaryResult, loading: summaryLoading } = useFetch(
    useCallback(() => countryName ? fetchCountrySummary(code, countryName) : Promise.resolve(null), [code, countryName]),
    [code, countryName]
  );

  if (countryLoading) return <LoadingState count={6} />;
  if (countryError) return <ErrorState message={countryError} />;
  if (!country) return <EmptyState title="Country not found" icon={<GlobeIcon size={32} />} />;

  const ind = indicators?.data || {};
  const news = newsData?.articles || [];
  const techs = techResult?.trends || [];
  const startups = startupResult?.startups || [];
  const research = researchResult?.papers || [];
  const summary = summaryResult?.data;

  // Prepare chart data
  const indicatorChartData = [
    ind.gdpPerCapita?.value && { name: 'GDP/Capita', value: Math.round(ind.gdpPerCapita.value) },
    ind.lifeExpectancy?.value && { name: 'Life Exp.', value: Math.round(ind.lifeExpectancy.value * 100) / 100 },
    ind.internetUsers?.value && { name: 'Internet %', value: Math.round(ind.internetUsers.value * 100) / 100 },
    ind.unemployment?.value && { name: 'Unemp. %', value: Math.round(ind.unemployment.value * 100) / 100 },
  ].filter(Boolean);

  const newsCategoryData = news.reduce((acc, a) => {
    const cat = a.category || 'general';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(newsCategoryData).map(([name, value]) => ({ name, value }));

  return (
    <div className="country-details fade-in">
      {/* Country Header */}
      <header className="country-header">
        <div className="country-header-flag">
          <img src={country.flag || country.flagSvg} alt={`Flag of ${country.name}`} />
        </div>
        <div className="country-header-info">
          <h1 className="page-title">{country.name}</h1>
          {country.officialName && country.officialName !== country.name && (
            <p className="country-official-name">{country.officialName}</p>
          )}
          <div className="country-header-meta">
            <span className="flex items-center gap-xs"><MapPinIcon size={14} className="text-secondary" /> {country.capital?.[0] || 'N/A'}</span>
            <span className="flex items-center gap-xs"><GlobeIcon size={14} className="text-secondary" /> {country.region}{country.subregion ? ` — ${country.subregion}` : ''}</span>
            <span className="flex items-center gap-xs"><UsersIcon size={14} className="text-secondary" /> {formatNumber(country.population)}</span>
            <span className="flex items-center gap-xs"><CurrencyDollarIcon size={14} className="text-secondary" /> {getCurrencies(country.currencies)}</span>
            <span className="flex items-center gap-xs"><ChatBubbleIcon size={14} className="text-secondary" /> {getLanguages(country.languages)}</span>
          </div>
        </div>
      </header>

      {/* Key Indicators */}
      <section className="country-indicators">
        <div className="grid grid-4">
          <StatCard label="Population" value={formatNumber(country.population)} icon={<UsersIcon size={18} />} />
          <StatCard label="GDP" value={ind.gdp?.value ? formatCurrency(ind.gdp.value) : 'N/A'} icon={<CurrencyDollarIcon size={18} />} />
          <StatCard label="GDP per Capita" value={ind.gdpPerCapita?.value ? formatCurrency(ind.gdpPerCapita.value) : 'N/A'} icon={<TrendingUpIcon size={18} />} />
          <StatCard label="Life Expectancy" value={ind.lifeExpectancy?.value ? `${ind.lifeExpectancy.value.toFixed(1)} years` : 'N/A'} icon={<HeartIcon size={18} />} />
          <StatCard label="Internet Users" value={ind.internetUsers?.value ? `${ind.internetUsers.value.toFixed(1)}%` : 'N/A'} icon={<WifiIcon size={18} />} />
          <StatCard label="Unemployment" value={ind.unemployment?.value ? `${ind.unemployment.value.toFixed(1)}%` : 'N/A'} icon={<ActivityIcon size={18} />} />
          <StatCard label="GDP Growth" value={ind.gdpGrowth?.value ? `${ind.gdpGrowth.value.toFixed(2)}%` : 'N/A'} icon={<TrendingDownIcon size={18} />} />
          <StatCard label="R&D Expenditure" value={ind.rdExpenditure?.value ? `${ind.rdExpenditure.value.toFixed(2)}% GDP` : 'N/A'} icon={<FlaskIcon size={18} />} />
        </div>
      </section>

      {/* AI Summary */}
      <Section title={`${country.name} — AI Intelligence Brief`}>
        {summaryLoading ? (
          <div className="card"><LoadingState count={1} type="text" /></div>
        ) : summary ? (
          <div className="card ai-summary-card">
            {summary.isDemo && !summary.model?.includes('gpt') && !summary.model?.includes('groq') && (
              <div className="demo-banner flex items-center gap-xs">
                <AlertCircleIcon size={14} />
                <span>AI summary generated using extractive fallback — live AI synthesis ready</span>
              </div>
            )}
            <p className="ai-summary-text">{summary.summary}</p>
            {summary.keyDevelopments?.length > 0 && (
              <div className="ai-summary-section">
                <h4>Key Developments</h4>
                <ul>{summary.keyDevelopments.map((d, i) => <li key={i}>{d}</li>)}</ul>
              </div>
            )}
            {summary.trends?.length > 0 && (
              <div className="ai-summary-section">
                <h4>Trends</h4>
                <ul>{summary.trends.map((t, i) => <li key={i}>{t}</li>)}</ul>
              </div>
            )}
            <p className="ai-summary-meta flex items-center gap-xs">
              <SparklesIcon size={14} className="text-brand" />
              <span>Generated by {summary.model || 'AI Engine'} • {timeAgo(summary.generatedAt)}</span>
            </p>
          </div>
        ) : (
          <EmptyState title="Summary unavailable" message="AI summary could not be generated at this time." icon={<BotIcon size={30} />} />
        )}
      </Section>


      {/* Latest News */}
      <Section title="Latest News">
        <FilterBar
          filters={['politics', 'economy', 'technology', 'science', 'business', 'health', 'environment']}
          activeFilter={newsCategory}
          onFilter={setNewsCategory}
        />
        {news.length > 0 ? (
          <div className="grid grid-auto-fill">
            {news.slice(0, 12).map((article, i) => (
              <NewsCard key={i} article={article} compact />
            ))}
          </div>
        ) : (
          <EmptyState title="No news available" message={`No recent news found for ${country.name}`} icon={<NewspaperIcon size={28} />} />
        )}
      </Section>

      {/* Technology Landscape */}
      <Section title="Technology Landscape">
        {techs.length > 0 ? (
          <div className="grid grid-auto-fill">
            {techs.slice(0, 8).map((t, i) => <TechCard key={i} item={t} />)}
          </div>
        ) : (
          <EmptyState title="No technology data" message="Technology trends data is not currently available" icon={<CpuIcon size={28} />} />
        )}
      </Section>

      {/* Startups & Innovation */}
      <Section title="Startups & Innovation">
        {startups.length > 0 ? (
          <div className="grid grid-auto-fill">
            {startups.slice(0, 6).map((s, i) => <StartupCard key={i} startup={s} />)}
          </div>
        ) : (
          <EmptyState title="Startup data unavailable" message="Startup data is currently unavailable from connected sources." icon={<RocketIcon size={28} />} />
        )}
      </Section>

      {/* Research */}
      <Section title="Research & Development">
        {research.length > 0 ? (
          <div className="grid grid-auto-fill">
            {research.slice(0, 6).map((p, i) => <ResearchCard key={i} paper={p} />)}
          </div>
        ) : (
          <EmptyState title="No research data" message="Research publications data is not currently available" icon={<FlaskIcon size={28} />} />
        )}
      </Section>


      {/* Charts */}
      {(indicatorChartData.length > 0 || pieData.length > 0) && (
        <Section title="Economic Indicators">
          <div className="grid grid-2">
            {indicatorChartData.length > 0 && (
              <div className="card">
                <h3 className="card-title">Key Indicators</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={indicatorChartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="var(--color-brand)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {pieData.length > 0 && (
              <div className="card">
                <h3 className="card-title">News Category Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Sources */}
      <section className="country-sources">
        <h3 className="card-title">Data Sources</h3>
        <p className="timestamp">
          Country data: REST Countries API • Economic indicators: World Bank • 
          News: GDELT • Research: Crossref • Technology: GitHub + GDELT
        </p>
      </section>
    </div>
  );
}
