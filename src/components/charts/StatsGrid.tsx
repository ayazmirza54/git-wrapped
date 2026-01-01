// ========================================
// Stats Grid Component (for radial/summary stats)
// ========================================

import { AnimatedCounter } from '../ui';
import './StatsGrid.css';

interface StatItem {
    label: string;
    value: number;
    suffix?: string;
    icon?: string;
    color?: string;
}

interface StatsGridProps {
    stats: StatItem[];
    className?: string;
    columns?: 2 | 3 | 4;
}

export function StatsGrid({ stats, className = '', columns = 2 }: StatsGridProps) {
    return (
        <div className={`stats-grid stats-grid--cols-${columns} ${className}`}>
            {stats.map((stat, index) => (
                <div
                    key={stat.label}
                    className="stats-grid__item"
                    style={{
                        animationDelay: `${index * 100}ms`,
                        '--stat-color': stat.color || 'var(--accent-purple)',
                    } as React.CSSProperties}
                >
                    {stat.icon && <span className="stats-grid__icon">{stat.icon}</span>}
                    <div className="stats-grid__value">
                        <AnimatedCounter
                            value={stat.value}
                            suffix={stat.suffix}
                            delay={index * 100}
                        />
                    </div>
                    <div className="stats-grid__label">{stat.label}</div>
                </div>
            ))}
        </div>
    );
}
