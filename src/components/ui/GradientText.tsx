// ========================================
// GradientText Component
// ========================================

import { type ReactNode, type CSSProperties } from 'react';
import './GradientText.css';

interface GradientTextProps {
    children: ReactNode;
    gradient?: 'primary' | 'green' | 'warm' | 'cool' | 'aurora';
    className?: string;
    style?: CSSProperties;
    as?: 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'p';
    animate?: boolean;
}

export function GradientText({
    children,
    gradient = 'primary',
    className = '',
    style,
    as: Component = 'span',
    animate = false,
}: GradientTextProps) {
    const classes = [
        'gradient-text',
        `gradient-text--${gradient}`,
        animate && 'gradient-text--animate',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <Component className={classes} style={style}>
            {children}
        </Component>
    );
}
