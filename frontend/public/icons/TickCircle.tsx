import React, { FC } from 'react';

interface CloseCircleProps {
    color: string;
}

const CloseCircle: FC<CloseCircleProps> = ({ color }) => (
    <svg viewBox="0 0 12 13" fill="none">
        <path
            d="M6 11.083C8.75 11.083 11 8.83301 11 6.08301C11 3.33301 8.75 1.08301 6 1.08301C3.25 1.08301 1 3.33301 1 6.08301C1 8.83301 3.25 11.083 6 11.083Z"
            className={color}
            strokeWidth="0.829071"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M3.875 6.08297L5.29 7.49797L8.125 4.66797"
            className={color}
            strokeWidth="0.829071"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export default CloseCircle;
