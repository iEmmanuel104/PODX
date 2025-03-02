'use client';
import { memo } from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    fullScreen?: boolean;
    text?: string;
}

const LoadingSpinner = memo(({ size = 'md', fullScreen = false, text }: LoadingSpinnerProps) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    const spinner = (
        <div className={`animate-pulse ${sizeClasses[size]} rounded-full bg-gray-600`} />
    );

    if (fullScreen) {
        return (
            <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center gap-4">
                {spinner}
                {text && <span className="text-gray-400 text-sm animate-fade-in">{text}</span>}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center gap-3">
            {spinner}
            {text && <span className="text-gray-400 text-xs animate-fade-in">{text}</span>}
        </div>
    );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
