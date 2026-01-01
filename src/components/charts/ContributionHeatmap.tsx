// ========================================
// Contribution Heatmap Component
// ========================================

import { useMemo } from 'react';
import type { ContributionCalendar } from '../../types';
import './ContributionHeatmap.css';

interface ContributionHeatmapProps {
    calendar: ContributionCalendar;
    year: number;
    className?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function getContributionLevel(count: number): string {
    if (count === 0) return 'none';
    if (count <= 3) return 'low';
    if (count <= 6) return 'medium';
    if (count <= 9) return 'high';
    return 'max';
}

export function ContributionHeatmap({
    calendar,
    year,
    className = '',
}: ContributionHeatmapProps) {
    // Calculate month labels position
    const monthLabels = useMemo(() => {
        const labels: { month: string; weekIndex: number }[] = [];
        let currentMonth = -1;

        calendar.weeks.forEach((week, weekIndex) => {
            for (const day of week.contributionDays) {
                const date = new Date(day.date);
                if (date.getFullYear() === year && date.getMonth() !== currentMonth) {
                    currentMonth = date.getMonth();
                    labels.push({ month: MONTHS[currentMonth], weekIndex });
                    break;
                }
            }
        });

        return labels;
    }, [calendar, year]);

    return (
        <div className={`heatmap ${className}`}>
            {/* Month labels */}
            <div className="heatmap__months">
                {monthLabels.map(({ month, weekIndex }) => (
                    <span
                        key={`${month}-${weekIndex}`}
                        className="heatmap__month-label"
                        style={{ gridColumnStart: weekIndex + 2 }}
                    >
                        {month}
                    </span>
                ))}
            </div>

            <div className="heatmap__grid-container">
                {/* Day labels */}
                <div className="heatmap__days">
                    {DAYS.map((day, index) => (
                        <span
                            key={day}
                            className="heatmap__day-label"
                            style={{ visibility: index % 2 === 1 ? 'visible' : 'hidden' }}
                        >
                            {day}
                        </span>
                    ))}
                </div>

                {/* Contribution grid */}
                <div className="heatmap__grid">
                    {calendar.weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="heatmap__week">
                            {week.contributionDays.map((day, dayIndex) => {
                                const date = new Date(day.date);
                                const isCurrentYear = date.getFullYear() === year;

                                return (
                                    <div
                                        key={day.date}
                                        className={`heatmap__cell heatmap__cell--${getContributionLevel(
                                            day.contributionCount
                                        )}`}
                                        style={{
                                            opacity: isCurrentYear ? 1 : 0.3,
                                            animationDelay: `${weekIndex * 10 + dayIndex * 5}ms`,
                                        }}
                                        title={`${day.date}: ${day.contributionCount} contributions`}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="heatmap__legend">
                <span className="heatmap__legend-label">Less</span>
                <div className="heatmap__legend-cells">
                    <div className="heatmap__cell heatmap__cell--none" />
                    <div className="heatmap__cell heatmap__cell--low" />
                    <div className="heatmap__cell heatmap__cell--medium" />
                    <div className="heatmap__cell heatmap__cell--high" />
                    <div className="heatmap__cell heatmap__cell--max" />
                </div>
                <span className="heatmap__legend-label">More</span>
            </div>
        </div>
    );
}
