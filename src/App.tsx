// ========================================
// Main App Component
// ========================================

import { useState, useCallback, useEffect } from 'react';
import type { GitHubUser, WrappedInsights, LoadingState } from './types';
import { fetchAllGitHubData, GitHubApiError } from './api/github';
import { calculateInsights } from './services/insightsEngine';
import { LandingPage, WrappedPage } from './pages';
import './styles/variables.css';
import './App.css';

function App() {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [insights, setInsights] = useState<WrappedInsights | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);

  // Check URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlUser = params.get('user');
    const urlYear = params.get('year');

    if (urlUser) {
      const yearNum = urlYear ? parseInt(urlYear, 10) : new Date().getFullYear();
      handleSearch(urlUser, yearNum);
    }
  }, []);

  const handleSearch = useCallback(async (username: string, selectedYear: number) => {
    setLoadingState('loading');
    setError(null);
    setYear(selectedYear);

    try {
      // Fetch GitHub data
      const data = await fetchAllGitHubData(username, selectedYear);

      // Calculate insights
      const wrappedInsights = calculateInsights(data, selectedYear);

      // Update state
      setUser(data.user);
      setInsights(wrappedInsights);
      setLoadingState('success');

      // Update URL
      const newUrl = `${window.location.pathname}?user=${username}&year=${selectedYear}`;
      window.history.pushState({}, '', newUrl);
    } catch (err) {
      console.error('Failed to fetch GitHub data:', err);

      if (err instanceof GitHubApiError) {
        if (err.code === 'NOT_FOUND') {
          setError(`User "${username}" not found. Please check the username and try again.`);
        } else if (err.code === 'RATE_LIMITED') {
          setError(err.message);
        } else {
          setError('Failed to fetch GitHub data. Please try again later.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }

      setLoadingState('error');
    }
  }, []);

  const handleReset = useCallback(() => {
    setUser(null);
    setInsights(null);
    setLoadingState('idle');
    setError(null);

    // Clear URL params
    window.history.pushState({}, '', window.location.pathname);
  }, []);

  // Show wrapped experience if we have data
  if (loadingState === 'success' && user && insights) {
    return (
      <WrappedPage
        user={user}
        insights={insights}
        year={year}
        onReset={handleReset}
      />
    );
  }

  // Show landing page
  return (
    <LandingPage
      onSearch={handleSearch}
      loading={loadingState === 'loading'}
      error={error}
    />
  );
}

export default App;
