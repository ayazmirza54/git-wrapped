// ========================================
// Heatmap Screen Component
// ========================================

import type { WrappedInsights } from '../../types';
import { GradientText, GlassCard, AnimatedCounter } from '../ui';
import { ContributionHeatmap } from '../charts';
import './screens.css';

interface HeatmapScreenProps {
    insights: WrappedInsights;
    year: number;
}

export function HeatmapScreen({ insights, year }: HeatmapScreenProps) {
    return (
        <div className="screen screen--heatmap">
            <div className="screen__content screen__content--wide">
                <p className="screen__label animate-fade-in-up">Your Contribution Map</p>

                <h2 className="screen__title animate-fade-in-up delay-200">
                    <GradientText gradient="green">
                        <AnimatedCounter value={insights.totalActiveDays} duration={1500} />{' '}
                        Active Days
                    </GradientText>
                </h2>

                <GlassCard
                    className="heatmap__card animate-fade-in-up delay-300"
                    gradient="green"
                >
                    <ContributionHeatmap
                        calendar={insights.contributionCalendar}
                        year={year}
                    />
                </GlassCard>

                <div className="heatmap__stats animate-fade-in-up delay-500">
                    <div className="heatmap__stat">
                        <span className="heatmap__stat-value">
                            {insights.longestStreak}
                        </span>
                        <span className="heatmap__stat-label">Longest Streak 🔥</span>
                    </div>

                    <div className="heatmap__stat">
                        <span className="heatmap__stat-value">
                            {insights.mostProductiveDay}
                        </span>
                        <span className="heatmap__stat-label">Most Active Day</span>
                    </div>

                    <div className="heatmap__stat">
                        <span className="heatmap__stat-value">
                            {insights.peakHourRange}
                        </span>
                        <span className="heatmap__stat-label">Peak Hours</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
