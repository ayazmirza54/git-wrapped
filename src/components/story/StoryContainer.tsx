// ========================================
// Story Container Component
// ========================================

import { useState, useCallback, useEffect, type ReactNode } from 'react';
import './StoryContainer.css';

interface StoryContainerProps {
    children: ReactNode[];
    onComplete?: () => void;
    className?: string;
}

export function StoryContainer({
    children,
    onComplete,
    className = '',
}: StoryContainerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState<'next' | 'prev'>('next');
    const [isAnimating, setIsAnimating] = useState(false);

    const totalScreens = children.length;

    const goToNext = useCallback(() => {
        if (isAnimating) return;
        if (currentIndex < totalScreens - 1) {
            setDirection('next');
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentIndex((prev) => prev + 1);
                setIsAnimating(false);
            }, 300);
        } else if (onComplete) {
            onComplete();
        }
    }, [currentIndex, totalScreens, isAnimating, onComplete]);

    const goToPrev = useCallback(() => {
        if (isAnimating) return;
        if (currentIndex > 0) {
            setDirection('prev');
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentIndex((prev) => prev - 1);
                setIsAnimating(false);
            }, 300);
        }
    }, [currentIndex, isAnimating]);

    const goToScreen = useCallback(
        (index: number) => {
            if (isAnimating || index === currentIndex) return;
            setDirection(index > currentIndex ? 'next' : 'prev');
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentIndex(index);
                setIsAnimating(false);
            }, 300);
        },
        [currentIndex, isAnimating]
    );

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                goToNext();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                goToPrev();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToNext, goToPrev]);

    // Touch/swipe support
    useEffect(() => {
        let touchStartX = 0;
        let touchEndX = 0;

        const handleTouchStart = (e: TouchEvent) => {
            touchStartX = e.changedTouches[0].screenX;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    goToNext();
                } else {
                    goToPrev();
                }
            }
        };

        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [goToNext, goToPrev]);

    return (
        <div className={`story-container ${className}`}>
            {/* Progress bar */}
            <div className="story-progress">
                {children.map((_, index) => (
                    <button
                        key={index}
                        className={`story-progress__dot ${index === currentIndex ? 'story-progress__dot--active' : ''
                            } ${index < currentIndex ? 'story-progress__dot--completed' : ''}`}
                        onClick={() => goToScreen(index)}
                        aria-label={`Go to screen ${index + 1}`}
                    />
                ))}
            </div>

            {/* Screen container */}
            <div className="story-screen-wrapper">
                <div
                    className={`story-screen ${isAnimating ? `story-screen--exit-${direction}` : 'story-screen--enter'
                        }`}
                >
                    {children[currentIndex]}
                </div>
            </div>

            {/* Navigation buttons */}
            <div className="story-nav">
                <button
                    className="story-nav__btn story-nav__btn--prev"
                    onClick={goToPrev}
                    disabled={currentIndex === 0}
                    aria-label="Previous screen"
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>

                <div className="story-nav__counter">
                    {currentIndex + 1} / {totalScreens}
                </div>

                <button
                    className="story-nav__btn story-nav__btn--next"
                    onClick={goToNext}
                    aria-label={currentIndex === totalScreens - 1 ? 'Complete' : 'Next screen'}
                >
                    {currentIndex === totalScreens - 1 ? (
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M5 12l5 5L20 7" />
                        </svg>
                    ) : (
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
                    )}
                </button>
            </div>
        </div>
    );
}
