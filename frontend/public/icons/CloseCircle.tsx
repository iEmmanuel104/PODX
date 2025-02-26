import React, { FC } from 'react';

interface CloseCircleProps {
    color: string;
}

const CloseCircle: FC<CloseCircleProps> = ({ color }) => (
    <svg viewBox="0 0 12 13" fill="none">
        <path
            d="M6.00004 11.083C8.75004 11.083 11 8.83301 11 6.08301C11 3.33301 8.75004 1.08301 6.00004 1.08301C3.25004 1.08301 1.00004 3.33301 1.00004 6.08301C1.00004 8.83301 3.25004 11.083 6.00004 11.083Z"
            className={color}
            strokeWidth="0.829071"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M4.58499 7.49797L7.41499 4.66797"
            className={color}
            strokeWidth="0.829071"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M7.41499 7.49797L4.58499 4.66797"
            className={color}
            strokeWidth="0.829071"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export default CloseCircle;
