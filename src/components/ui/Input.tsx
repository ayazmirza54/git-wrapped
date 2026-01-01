// ========================================
// Input Component
// ========================================

import { type InputHTMLAttributes, forwardRef } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            icon,
            iconPosition = 'left',
            className = '',
            id,
            ...props
        },
        ref
    ) => {
        const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

        const classes = [
            'input-wrapper',
            icon && `input-wrapper--icon-${iconPosition}`,
            error && 'input-wrapper--error',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div className={classes}>
                {label && (
                    <label className="input-label" htmlFor={inputId}>
                        {label}
                    </label>
                )}
                <div className="input-container">
                    {icon && iconPosition === 'left' && (
                        <span className="input-icon input-icon--left">{icon}</span>
                    )}
                    <input ref={ref} id={inputId} className="input" {...props} />
                    {icon && iconPosition === 'right' && (
                        <span className="input-icon input-icon--right">{icon}</span>
                    )}
                </div>
                {error && <span className="input-error">{error}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';
