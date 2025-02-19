import { cn } from '@/lib/utils';

interface RetryProps {
    className?: string;
}

const Retry = ({ className }: RetryProps) => (
    <svg
        width="12"
        height="12"
        viewBox="0 0 8 8"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(className)}
    >
        <path
            d="M4.96332 1.69338C4.67332 1.60672 4.35332 1.55005 3.99999 1.55005C2.40332 1.55005 1.10999 2.84338 1.10999 4.44005C1.10999 6.04005 2.40332 7.33338 3.99999 7.33338C5.59665 7.33338 6.88999 6.04005 6.88999 4.44338C6.88999 3.85005 6.70998 3.29672 6.40332 2.83672"
            stroke="#D4D4D4"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M5.37666 1.77341L4.41333 0.666748"
            stroke="#D4D4D4"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M5.37663 1.77344L4.2533 2.59344"
            stroke="#D4D4D4"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export default Retry;