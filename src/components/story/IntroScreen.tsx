// ========================================
// Intro Screen Component
// ========================================

import type { GitHubUser } from '../../types';
import { GradientText } from '../ui';
import './screens.css';

interface IntroScreenProps {
    user: GitHubUser;
    year: number;
}

export function IntroScreen({ user, year }: IntroScreenProps) {
    return (
        <div className="screen screen--intro">
            <div className="screen__content">
                {/* Animated background elements */}
                <div className="intro__bg-shapes">
                    <div className="intro__shape intro__shape--1" />
                    <div className="intro__shape intro__shape--2" />
                    <div className="intro__shape intro__shape--3" />
                </div>

                {/* Avatar */}
                <div className="intro__avatar-wrapper">
                    <img
                        src={user.avatar_url}
                        alt={user.name || user.login}
                        className="intro__avatar"
                    />
                    <div className="intro__avatar-ring" />
                </div>

                {/* Welcome text */}
                <p className="intro__greeting animate-fade-in-up delay-200">
                    Hey, <span className="intro__username">@{user.login}</span>
                </p>

                <h1 className="intro__title animate-fade-in-up delay-300">
                    <GradientText gradient="primary" animate>
                        Your {year}
                    </GradientText>
                    <br />
                    <GradientText gradient="aurora" animate>
                        GitHub Wrapped
                    </GradientText>
                </h1>

                <p className="intro__subtitle animate-fade-in-up delay-500">
                    Let's see what you've been building
                </p>

                {/* Scroll indicator */}
                <div className="intro__scroll-hint animate-fade-in delay-700">
                    <span>Tap or swipe to continue</span>
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
