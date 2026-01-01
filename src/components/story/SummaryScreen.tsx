// ========================================
// Summary Screen Component (Shareable)
// ========================================

import { useRef, useState } from 'react';
import type { GitHubUser, WrappedInsights } from '../../types';
import { Button } from '../ui';
import './screens.css';

interface SummaryScreenProps {
    user: GitHubUser;
    insights: WrappedInsights;
    year: number;
}

export function SummaryScreen({ user, insights, year }: SummaryScreenProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [copying, setCopying] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const topLanguage = insights.topLanguages[0];

    const handleDownload = async () => {
        if (!cardRef.current) return;

        setDownloading(true);
        try {
            // Dynamic import for html-to-image
            const { toPng } = await import('html-to-image');
            const dataUrl = await toPng(cardRef.current, {
                quality: 1,
                pixelRatio: 2,
                backgroundColor: '#0d1117',
            });

            const link = document.createElement('a');
            link.download = `github-wrapped-${user.login}-${year}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to download:', err);
            alert('Failed to download image. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    const handleCopyLink = async () => {
        setCopying(true);
        try {
            const url = `${window.location.origin}?user=${user.login}&year=${year}`;
            await navigator.clipboard.writeText(url);
            setTimeout(() => setCopying(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            setCopying(false);
        }
    };

    const handleShareTwitter = () => {
        const text = `Check out my ${year} GitHub Wrapped! 🎁\n\n📊 ${insights.totalContributions} contributions\n💻 ${topLanguage?.name || 'Code'} enthusiast\n🔥 ${insights.longestStreak} day streak\n\n`;
        const url = `${window.location.origin}?user=${user.login}&year=${year}`;
        window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
            '_blank'
        );
    };

    return (
        <div className="screen screen--summary">
            <div className="screen__content">
                <p className="screen__label animate-fade-in-up">Your Year in Review</p>

                {/* Shareable Card */}
                <div
                    ref={cardRef}
                    className="summary-card animate-fade-in-up delay-200"
                >
                    <div className="summary-card__header">
                        <span className="summary-card__logo">GitHub Wrapped</span>
                        <span className="summary-card__year">{year}</span>
                    </div>

                    <div className="summary-card__user">
                        <img
                            src={user.avatar_url}
                            alt={user.login}
                            className="summary-card__avatar"
                        />
                        <div className="summary-card__info">
                            <span className="summary-card__name">
                                {user.name || user.login}
                            </span>
                            <span className="summary-card__username">@{user.login}</span>
                        </div>
                    </div>

                    <div className="summary-card__stats">
                        <div className="summary-card__stat">
                            <span className="summary-card__stat-value">
                                {insights.totalContributions.toLocaleString()}
                            </span>
                            <span className="summary-card__stat-label">Contributions</span>
                        </div>

                        <div className="summary-card__stat">
                            <span className="summary-card__stat-value">
                                {insights.longestStreak}
                            </span>
                            <span className="summary-card__stat-label">Day Streak</span>
                        </div>

                        <div className="summary-card__stat">
                            <span className="summary-card__stat-value">
                                {insights.repositoriesContributedTo}
                            </span>
                            <span className="summary-card__stat-label">Repositories</span>
                        </div>
                    </div>

                    <div className="summary-card__badges">
                        {topLanguage && (
                            <span
                                className="summary-card__badge"
                                style={{ borderColor: topLanguage.color }}
                            >
                                <span
                                    className="summary-card__badge-dot"
                                    style={{ backgroundColor: topLanguage.color }}
                                />
                                {topLanguage.name}
                            </span>
                        )}

                        <span className="summary-card__badge summary-card__badge--personality">
                            {insights.personality.emoji} {insights.personality.title}
                        </span>
                    </div>

                    <div className="summary-card__footer">
                        <span>Generated by GitHub Wrapped</span>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="summary__actions animate-fade-in-up delay-400">
                    <Button
                        variant="gradient"
                        onClick={handleDownload}
                        loading={downloading}
                        icon={
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                            </svg>
                        }
                    >
                        Download
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={handleCopyLink}
                        icon={
                            copying ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12l5 5L20 7" />
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                                </svg>
                            )
                        }
                    >
                        {copying ? 'Copied!' : 'Copy Link'}
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={handleShareTwitter}
                        icon={
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                        }
                    >
                        Share
                    </Button>
                </div>

                <p className="screen__insight animate-fade-in-up delay-500">
                    Thanks for an amazing {year}! 🎉
                </p>
            </div>
        </div>
    );
}
