// ========================================
// Button Component
// ========================================

import { type ReactNode, type ButtonHTMLAttributes } from 'react';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'gradient';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: ReactNode;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const classes = [
        'btn',
        `btn--${variant}`,
        `btn--${size}`,
        loading && 'btn--loading',
        fullWidth && 'btn--full-width',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <button className={classes} disabled={disabled || loading} {...props}>
            {loading && <span className="btn__spinner" />}
            {icon && iconPosition === 'left' && !loading && (
                <span className="btn__icon btn__icon--left">{icon}</span>
            )}
            <span className="btn__text">{children}</span>
            {icon && iconPosition === 'right' && !loading && (
                <span className="btn__icon btn__icon--right">{icon}</span>
            )}
        </button>
    );
}
