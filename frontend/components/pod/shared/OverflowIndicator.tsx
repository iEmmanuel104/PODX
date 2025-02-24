import React from 'react';

interface OverflowIndicatorProps {
    count: number;
    style?: React.CSSProperties;
}

export const OverflowIndicator = ({ count, style }: OverflowIndicatorProps) => {
    return (
        <div 
            className="flex items-center p-[6px_12px] gap-2 bg-[rgba(75,75,75,0.5)] backdrop-blur-[5.7px] rounded-[1000px]"
            style={style}
        >
            <div className="flex items-center bg-transparent p-0.5">
                {[...Array(3)].map((_, index) => (
                    <div
                        key={index}
                        className="w-6 h-6 rounded-full bg-[#2A2A2A] flex items-center justify-center -ml-1.5 first:ml-0 border border-[#1D1D1D]"
                        style={{ zIndex: 3 - index }}
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-[#808080]"
                        >
                            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                ))}
            </div>
            <span className="text-white text-sm">+{count}</span>
        </div>
    );
}; 