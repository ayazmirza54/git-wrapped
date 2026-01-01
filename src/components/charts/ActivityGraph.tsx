// ========================================
// Activity Line Graph Component
// ========================================

import { useMemo } from 'react';
import type { MonthlyActivity } from '../../types';
import './ActivityGraph.css';

interface ActivityGraphProps {
    data: MonthlyActivity[];
    className?: string;
}

export function ActivityGraph({ data, className = '' }: ActivityGraphProps) {
    const { points, pathD, areaD } = useMemo(() => {
        const max = Math.max(...data.map((d) => d.contributions), 1);
        const width = 100; // Percentage width
        const height = 100; // Percentage height
        const padding = 5;

        const pts = data.map((d, i) => ({
            x: padding + (i / (data.length - 1)) * (width - padding * 2),
            y: height - padding - (d.contributions / max) * (height - padding * 2),
            value: d.contributions,
            month: d.month,
        }));

        // Create SVG path for line
        let pathD = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) {
            // Bezier curve for smooth line
            const prevPt = pts[i - 1];
            const currPt = pts[i];
            const cpx = (prevPt.x + currPt.x) / 2;
            pathD += ` C ${cpx} ${prevPt.y}, ${cpx} ${currPt.y}, ${currPt.x} ${currPt.y}`;
        }

        // Create area path (for gradient fill)
        let areaD = pathD;
        areaD += ` L ${pts[pts.length - 1].x} ${height}`;
        areaD += ` L ${pts[0].x} ${height}`;
        areaD += ' Z';

        return { points: pts, pathD, areaD };
    }, [data]);

    return (
        <div className={`activity-graph ${className}`}>
            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="activity-graph__svg"
            >
                <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--accent-blue-dark)" />
                        <stop offset="50%" stopColor="var(--accent-primary)" />
                        <stop offset="100%" stopColor="var(--accent-blue-light)" />
                    </linearGradient>
                </defs>

                {/* Area fill */}
                <path
                    d={areaD}
                    fill="url(#areaGradient)"
                    className="activity-graph__area"
                />

                {/* Line */}
                <path
                    d={pathD}
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="activity-graph__line"
                />

                {/* Data points */}
                {points.map((pt, i) => (
                    <circle
                        key={i}
                        cx={pt.x}
                        cy={pt.y}
                        r="1.5"
                        fill="var(--accent-primary)"
                        className="activity-graph__point"
                        style={{ animationDelay: `${i * 50}ms` }}
                    />
                ))}
            </svg>

            {/* X-axis labels */}
            <div className="activity-graph__labels">
                {data.map((d, i) => (
                    <span
                        key={i}
                        className="activity-graph__label"
                        style={{
                            opacity: i % 2 === 0 || data.length <= 6 ? 1 : 0,
                        }}
                    >
                        {d.month}
                    </span>
                ))}
            </div>

            {/* Tooltip overlay (simplified - no hover state tracking) */}
            <div className="activity-graph__values">
                {data
                    .filter((_, i) => data[i].contributions > 0)
                    .slice(0, 3)
                    .map((d, i) => (
                        <div key={i} className="activity-graph__value-badge">
                            {d.month}: {d.contributions}
                        </div>
                    ))}
            </div>
        </div>
    );
}
