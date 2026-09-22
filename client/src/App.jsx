import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import Navbar from './components/Navbar.jsx';
import { LoadingState } from './components/Common.jsx';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home.jsx'));
const GlobalDashboard = lazy(() => import('./pages/GlobalDashboard.jsx'));
const CountryExplorer = lazy(() => import('./pages/CountryExplorer.jsx'));
const CountryDetails = lazy(() => import('./pages/CountryDetails.jsx'));
const NewsExplorer = lazy(() => import('./pages/NewsExplorer.jsx'));
const TechnologyTrends = lazy(() => import('./pages/TechnologyTrends.jsx'));
const StartupsInnovation = lazy(() => import('./pages/StartupsInnovation.jsx'));
const ResearchDevelopment = lazy(() => import('./pages/ResearchDevelopment.jsx'));
const CountryComparison = lazy(() => import('./pages/CountryComparison.jsx'));
const SearchPage = lazy(() => import('./pages/SearchPage.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));

function PageLoader() {
  return (
    <div style={{ padding: 'var(--space-xl)' }}>
      <LoadingState count={3} />
    </div>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <div className="app-main">
            <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
            <main className="app-content" role="main">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/dashboard" element={<GlobalDashboard />} />
                  <Route path="/countries" element={<CountryExplorer />} />
                  <Route path="/country/:code" element={<CountryDetails />} />
                  <Route path="/news" element={<NewsExplorer />} />
                  <Route path="/technology" element={<TechnologyTrends />} />
                  <Route path="/startups" element={<StartupsInnovation />} />
                  <Route path="/research" element={<ResearchDevelopment />} />
                  <Route path="/compare" element={<CountryComparison />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
