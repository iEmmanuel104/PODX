import React from 'react';

interface IconProps {
    width?: number;
    height?: number;
    color?: string;
    className?: string;
}

const VisualEffects = ({ width = 24, height = 24, className }: IconProps) => {
    return (
        <i
            style={{
                fontSize: `${width}px`,
                lineHeight: `${height}px`,
            }}
            className={`google-symbols select-none ${className || ''}`}
            aria-hidden="true"
        >
            visual_effects
        </i>
    );
};

export default VisualEffects;
