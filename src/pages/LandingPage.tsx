// ========================================
// Landing Page
// ========================================

import { useState, type FormEvent } from 'react';
import { GlassCard, GradientText, Button, Input, LoadingSpinner } from '../components/ui';
import './LandingPage.css';

interface LandingPageProps {
    onSearch: (username: string, year: number) => void;
    loading: boolean;
    error: string | null;
}

export function LandingPage({ onSearch, loading, error }: LandingPageProps) {
    const [username, setUsername] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (username.trim()) {
            onSearch(username.trim(), year);
        }
    };

    return (
        <div className="landing">
            {/* Animated background */}
            <div className="landing__bg">
                <div className="landing__bg-gradient landing__bg-gradient--1" />
                <div className="landing__bg-gradient landing__bg-gradient--2" />
                <div className="landing__bg-gradient landing__bg-gradient--3" />
                <div className="landing__bg-grid" />
            </div>

            <main className="landing__content">
                {/* Logo/Header */}
                <div className="landing__header animate-fade-in-down">
                    <div className="landing__logo">
                        <svg
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="landing__github-icon"
                        >
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        <span>GitHub Wrapped</span>
                    </div>
                </div>
<br></br><br></br><br></br>
                {/* Hero */}
                <div className="landing__hero">
                    <h1 className="landing__title animate-fade-in-up">
                        <GradientText gradient="primary" animate>
                            Your Year
                        </GradientText>
                        <br />
                        <GradientText gradient="aurora" animate>
                            in Code
                        </GradientText>
                    </h1>

                    <p className="landing__subtitle animate-fade-in-up delay-200">
                        Discover your GitHub highlights, stats, and coding personality
                        <br />
                        wrapped up in a beautiful shareable story.
                    </p>
                </div>

                {/* Search Form */}
                <GlassCard className="landing__form-card animate-fade-in-up delay-300" glow>
                    <form onSubmit={handleSubmit} className="landing__form">
                        <Input
                            placeholder="Enter GitHub username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                            icon={
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            }
                        />

                        <div className="landing__year-select">
                            <label className="landing__year-label">Year</label>
                            <div className="landing__year-buttons">
                                {years.map((y) => (
                                    <button
                                        key={y}
                                        type="button"
                                        className={`landing__year-btn ${year === y ? 'landing__year-btn--active' : ''}`}
                                        onClick={() => setYear(y)}
                                        disabled={loading}
                                    >
                                        {y}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="gradient"
                            size="lg"
                            fullWidth
                            loading={loading}
                            disabled={!username.trim()}
                        >
                            Generate My Wrapped
                        </Button>
                    </form>

                    {error && (
                        <div className="landing__error">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}
                </GlassCard>

                {/* Loading overlay */}
                {loading && (
                    <div className="landing__loading">
                        <LoadingSpinner size="lg" label="Fetching your GitHub data..." />
                    </div>
                )}

                {/* Features */}
                <div className="landing__features animate-fade-in-up delay-500">
                    <div className="landing__feature">
                        <span className="landing__feature-icon">📊</span>
                        <span>Contribution Stats</span>
                    </div>
                    <div className="landing__feature">
                        <span className="landing__feature-icon">💻</span>
                        <span>Top Languages</span>
                    </div>
                    <div className="landing__feature">
                        <span className="landing__feature-icon">🔥</span>
                        <span>Streak Analysis</span>
                    </div>
                    <div className="landing__feature">
                        <span className="landing__feature-icon">🎭</span>
                        <span>Developer Personality</span>
                    </div>
                </div>

                {/* Footer */}
                <footer className="landing__footer animate-fade-in delay-700">
                    <p>
                        Made with 💜 •
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View on GitHub
                        </a>
                    </p>
                </footer>
            </main>
        </div>
    );
}
