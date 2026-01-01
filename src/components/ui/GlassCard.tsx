// ========================================
// GlassCard Component
// ========================================

import { type ReactNode, type CSSProperties } from 'react';
import './GlassCard.css';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
    glow?: boolean;
    gradient?: 'none' | 'primary' | 'green' | 'warm' | 'cool';
    onClick?: () => void;
    animate?: boolean;
}

export function GlassCard({
    children,
    className = '',
    style,
    glow = false,
    gradient = 'none',
    onClick,
    animate = false,
}: GlassCardProps) {
    const classes = [
        'glass-card',
        glow && 'glass-card--glow',
        gradient !== 'none' && `glass-card--gradient-${gradient}`,
        animate && 'glass-card--animate',
        onClick && 'glass-card--clickable',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={classes} style={style} onClick={onClick}>
            {children}
        </div>
    );
}
