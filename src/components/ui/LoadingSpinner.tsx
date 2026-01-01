// ========================================
// LoadingSpinner Component
// ========================================

import './LoadingSpinner.css';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    label?: string;
}

export function LoadingSpinner({
    size = 'md',
    className = '',
    label,
}: LoadingSpinnerProps) {
    return (
        <div className={`loading-spinner-container ${className}`}>
            <div className={`loading-spinner loading-spinner--${size}`}>
                <div className="loading-spinner__ring"></div>
                <div className="loading-spinner__ring"></div>
                <div className="loading-spinner__ring"></div>
            </div>
            {label && <span className="loading-spinner__label">{label}</span>}
        </div>
    );
}
