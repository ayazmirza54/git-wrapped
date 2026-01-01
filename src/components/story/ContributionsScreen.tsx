// ========================================
// Contributions Screen Component
// ========================================

import type { WrappedInsights } from '../../types';
import { GradientText, AnimatedCounter, GlassCard } from '../ui';
import { StatsGrid } from '../charts';
import './screens.css';

interface ContributionsScreenProps {
    insights: WrappedInsights;
    year: number;
}

export function ContributionsScreen({ insights, year }: ContributionsScreenProps) {
    const stats = [
        {
            label: 'Commits',
            value: insights.totalCommits,
            icon: '📝',
            color: 'var(--accent-green)',
        },
        {
            label: 'Pull Requests',
            value: insights.totalPRs,
            icon: '🔀',
            color: 'var(--accent-purple)',
        },
        {
            label: 'Issues',
            value: insights.totalIssues,
            icon: '🐛',
            color: 'var(--accent-orange)',
        },
        {
            label: 'Reviews',
            value: insights.totalReviews,
            icon: '👀',
            color: 'var(--accent-blue)',
        },
    ];

    return (
        <div className="screen screen--contributions">
            <div className="screen__content">
                <p className="screen__label animate-fade-in-up">In {year}, you made</p>

                <h2 className="screen__big-number animate-fade-in-up delay-200">
                    <AnimatedCounter
                        value={insights.totalContributions}
                        duration={2500}
                        className="contributions__count"
                    />
                </h2>

                <p className="screen__title animate-fade-in-up delay-300">
                    <GradientText gradient="green">Total Contributions</GradientText>
                </p>

                <GlassCard className="contributions__card animate-fade-in-up delay-400">
                    <StatsGrid stats={stats} columns={2} />
                </GlassCard>

                <p className="screen__insight animate-fade-in-up delay-500">
                    {insights.totalContributions > 1000
                        ? "🔥 You're on fire! Top-tier contributor!"
                        : insights.totalContributions > 500
                            ? '💪 Solid year of contributions!'
                            : insights.totalContributions > 100
                                ? '✨ Nice work! Consistency is key.'
                                : '🌱 Every commit counts. Keep growing!'}
                </p>
            </div>
        </div>
    );
}
