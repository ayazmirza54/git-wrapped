// ========================================
// Language Bar Chart Component
// ========================================

import type { LanguageStat } from '../../types';
import './LanguageChart.css';

interface LanguageChartProps {
    languages: LanguageStat[];
    className?: string;
    animated?: boolean;
}

export function LanguageChart({
    languages,
    className = '',
    animated = true,
}: LanguageChartProps) {

    return (
        <div className={`language-chart ${className}`}>
            {languages.map((lang, index) => (
                <div
                    key={lang.name}
                    className="language-chart__item"
                    style={{
                        animationDelay: animated ? `${index * 100}ms` : '0ms',
                    }}
                >
                    <div className="language-chart__header">
                        <div className="language-chart__name">
                            <span
                                className="language-chart__dot"
                                style={{ backgroundColor: lang.color }}
                            />
                            <span>{lang.name}</span>
                        </div>
                        <span className="language-chart__percentage">{lang.percentage}%</span>
                    </div>

                    <div className="language-chart__bar-container">
                        <div
                            className="language-chart__bar"
                            style={{
                                width: `${lang.percentage}%`,
                                backgroundColor: lang.color,
                            }}
                        />
                    </div>

                    <span className="language-chart__repos">
                        {lang.count} {lang.count === 1 ? 'repo' : 'repos'}
                    </span>
                </div>
            ))}
        </div>
    );
}
