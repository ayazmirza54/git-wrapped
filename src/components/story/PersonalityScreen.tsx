// ========================================
// Personality Screen Component
// ========================================

import type { WrappedInsights } from '../../types';
import { GradientText, GlassCard } from '../ui';
import './screens.css';

interface PersonalityScreenProps {
    insights: WrappedInsights;
}

export function PersonalityScreen({ insights }: PersonalityScreenProps) {
    const { personality } = insights;

    return (
        <div className="screen screen--personality">
            <div className="screen__content">
                <p className="screen__label animate-fade-in-up">Your developer personality is</p>

                <div className="personality__title animate-fade-in-up delay-200">
                    <span className="personality__emoji">{personality.emoji}</span>
                    <GradientText gradient="primary" as="h2" animate>
                        {personality.title}
                    </GradientText>
                </div>

                <p className="personality__description animate-fade-in-up delay-300">
                    {personality.description}
                </p>

                <div className="personality__traits animate-fade-in-up delay-400">
                    {personality.traits.map((trait, index) => (
                        <GlassCard
                            key={trait.name}
                            className="personality__trait"
                            style={{ animationDelay: `${400 + index * 100}ms` }}
                        >
                            <div className="trait__header">
                                <span className="trait__name">{trait.name}</span>
                                <span className="trait__value">{trait.value}%</span>
                            </div>

                            <div className="trait__bar-bg">
                                <div
                                    className="trait__bar"
                                    style={{
                                        width: `${trait.value}%`,
                                        animationDelay: `${500 + index * 100}ms`,
                                    }}
                                />
                            </div>

                            <p className="trait__label">{trait.label}</p>
                        </GlassCard>
                    ))}
                </div>
            </div>
        </div>
    );
}
