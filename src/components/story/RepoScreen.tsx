// ========================================
// Repository Highlights Screen
// ========================================

import type { WrappedInsights } from '../../types';
import { GradientText, GlassCard } from '../ui';
import { getLanguageColor } from '../../types';
import './screens.css';

interface RepoScreenProps {
    insights: WrappedInsights;
}

export function RepoScreen({ insights }: RepoScreenProps) {
    const topRepos = insights.topRepositories.slice(0, 4);

    return (
        <div className="screen screen--repos">
            <div className="screen__content">
                <p className="screen__label animate-fade-in-up">You contributed to</p>

                <h2 className="screen__title animate-fade-in-up delay-200">
                    <GradientText gradient="cool">
                        {insights.repositoriesContributedTo} Repositories
                    </GradientText>
                </h2>

                {insights.newRepositoriesCreated > 0 && (
                    <p className="screen__subtitle animate-fade-in-up delay-300">
                        with <strong>{insights.totalCommits.toLocaleString()}</strong> total commits &amp; <strong>{insights.newRepositoriesCreated}</strong> new repos
                    </p>
                )}
                {insights.newRepositoriesCreated === 0 && (
                    <p className="screen__subtitle animate-fade-in-up delay-300">
                        with <strong>{insights.totalCommits.toLocaleString()}</strong> total commits this year
                    </p>
                )}

                <div className="repos__grid animate-fade-in-up delay-400">
                    {topRepos.map((repo, index) => (
                        <GlassCard
                            key={repo.name}
                            className="repos__card"
                            glow={index === 0}
                            style={{ animationDelay: `${400 + index * 100}ms` }}
                        >
                            <div className="repos__card-header">
                                <span className="repos__name">{repo.name}</span>
                                {repo.stars > 0 && (
                                    <span className="repos__stars">⭐ {repo.stars}</span>
                                )}
                            </div>

                            {repo.description && (
                                <p className="repos__description">{repo.description}</p>
                            )}

                            <div className="repos__footer">
                                {repo.language && (
                                    <span className="repos__language">
                                        <span
                                            className="repos__lang-dot"
                                            style={{ backgroundColor: getLanguageColor(repo.language) }}
                                        />
                                        {repo.language}
                                    </span>
                                )}
                                {repo.commits > 0 && (
                                    <span className="repos__commits">{repo.commits} commits</span>
                                )}
                            </div>
                        </GlassCard>
                    ))}
                </div>

                <p className="screen__insight animate-fade-in-up delay-700">
                    {insights.repositoriesContributedTo > 20
                        ? '🚀 Prolific contributor!'
                        : '💼 Building amazing projects!'}
                </p>
            </div>
        </div>
    );
}
