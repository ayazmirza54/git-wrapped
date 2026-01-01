// ========================================
// Wrapped Page (Story Experience)
// ========================================

import type { GitHubUser, WrappedInsights } from '../types';
import {
    StoryContainer,
    IntroScreen,
    ContributionsScreen,
    LanguageScreen,
    RepoScreen,
    HeatmapScreen,
    PersonalityScreen,
    SummaryScreen,
} from '../components/story';
import './WrappedPage.css';

interface WrappedPageProps {
    user: GitHubUser;
    insights: WrappedInsights;
    year: number;
    onReset: () => void;
}

export function WrappedPage({ user, insights, year, onReset }: WrappedPageProps) {
    return (
        <div className="wrapped-page">
            {/* Back button */}
            <button className="wrapped-page__back" onClick={onReset}>
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>New Search</span>
            </button>

            {/* Story Flow */}
            <StoryContainer onComplete={onReset}>
                <IntroScreen user={user} year={year} />
                <ContributionsScreen insights={insights} year={year} />
                <LanguageScreen insights={insights} />
                <RepoScreen insights={insights} />
                <HeatmapScreen insights={insights} year={year} />
                <PersonalityScreen insights={insights} />
                <SummaryScreen user={user} insights={insights} year={year} />
            </StoryContainer>
        </div>
    );
}
