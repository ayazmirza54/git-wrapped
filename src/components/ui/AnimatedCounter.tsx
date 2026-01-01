// ========================================
// AnimatedCounter Component
// ========================================

import { useEffect, useState, useRef } from 'react';
import './AnimatedCounter.css';

interface AnimatedCounterProps {
    value: number;
    duration?: number;
    suffix?: string;
    prefix?: string;
    className?: string;
    delay?: number;
    formatNumber?: boolean;
}

export function AnimatedCounter({
    value,
    duration = 2000,
    suffix = '',
    prefix = '',
    className = '',
    delay = 0,
    formatNumber = true,
}: AnimatedCounterProps) {
    const [displayValue, setDisplayValue] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const elementRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        // Observer for intersection
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !hasAnimated) {
                    setHasAnimated(true);
                    startAnimation();
                }
            },
            { threshold: 0.5 }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
    }, [hasAnimated, value]);

    const startAnimation = () => {
        const startTime = Date.now() + delay;
        const startValue = 0;
        const endValue = value;

        const animate = () => {
            const now = Date.now();
            if (now < startTime) {
                requestAnimationFrame(animate);
                return;
            }

            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out cubic)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(startValue + (endValue - startValue) * easeOut);

            setDisplayValue(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    };

    const formattedValue = formatNumber
        ? displayValue.toLocaleString()
        : displayValue.toString();

    return (
        <span ref={elementRef} className={`animated-counter ${className}`}>
            {prefix}
            {formattedValue}
            {suffix}
        </span>
    );
}
