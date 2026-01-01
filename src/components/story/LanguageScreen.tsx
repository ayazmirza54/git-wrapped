// ========================================
// Language Screen Component
// ========================================

import type { WrappedInsights } from '../../types';
import { GradientText, GlassCard } from '../ui';
import { LanguageChart } from '../charts';
import './screens.css';

interface LanguageScreenProps {
    insights: WrappedInsights;
}

export function LanguageScreen({ insights }: LanguageScreenProps) {
    const topLanguage = insights.topLanguages[0];

    return (
        <div className="screen screen--languages">
            <div className="screen__content">
                <p className="screen__label animate-fade-in-up">Your top language was</p>

                {topLanguage && (
                    <div className="language__highlight animate-fade-in-up delay-200">
                        <span
                            className="language__dot"
                            style={{ backgroundColor: topLanguage.color }}
                        />
                        <GradientText
                            gradient="primary"
                            className="language__name"
                            as="h2"
                        >
                            {topLanguage.name}
                        </GradientText>
                    </div>
                )}

                <p className="screen__subtitle animate-fade-in-up delay-300">
                    across <strong>{insights.totalLanguages}</strong> languages
                </p>

                <GlassCard className="language__card animate-fade-in-up delay-400">
                    <LanguageChart languages={insights.topLanguages.slice(0, 5)} />
                </GlassCard>

                <p className="screen__insight animate-fade-in-up delay-500">
                    {insights.totalLanguages >= 5
                        ? '🌍 True polyglot developer!'
                        : insights.totalLanguages >= 3
                            ? '🎯 Multi-language wizard!'
                            : '🔧 Specialized and focused!'}
                </p>
            </div>
        </div>
    );
}
