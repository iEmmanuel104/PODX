import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Twinkle from '@/public/images/icons/Twinkle';
import Retry from '@/public/images/icons/Retry';

const DEFAULT_EXPLANATION = "PodX uses Proof of Attendance NFTs to restrict access. Attendees earn these onchain NFTs, which can grant entry to future exclusive events";

const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-2 w-[280px]"> {/* Fixed width to match content */}
        <div className="h-4 bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-700 rounded w-4/5"></div>
    </div>
);

const TokenGatingTooltip = () => {
    const [explanation, setExplanation] = useState(DEFAULT_EXPLANATION);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState(false);

    const handleReexplain = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsLoading(true);
        setError(false);

        try {
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: "Explain token gating in a simple, brief way that's easy for users to understand",
                    currentExplanation: explanation
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();

            if (!data.explanation) {
                throw new Error('No explanation received');
            }

            setExplanation(data.explanation);
            setError(false);
        } catch (error) {
            console.error('Failed to get re-explanation:', error);
            setError(true);
            // Keep the previous explanation instead of showing an error message
            setExplanation(prev => prev);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen} modal>
            <PopoverTrigger asChild>
                <div
                    className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center text-xs text-white/50 cursor-help"
                    role="button"
                    tabIndex={0}
                >
                    !
                </div>
            </PopoverTrigger>
            <PopoverContent
                className="bg-[#2B2B2B] rounded-xl border-none min-w-[329px] p-0"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-2">
                        <Twinkle />
                        <span className="text-sm bg-gradient-to-br from-[#6032F6] to-[#DDB958] text-transparent bg-clip-text">
                            AI Assisted
                        </span>
                    </div>
                    <button
                        onClick={handleReexplain}
                        disabled={isLoading}
                        className={`
              text-sm text-white flex items-center gap-2 px-2 py-1 rounded-full transition-colors
              ${error
                                ? 'bg-red-900/50 hover:bg-red-900/70'
                                : 'bg-[#444343] hover:bg-[#515151]'
                            }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
                    >
                        <Retry className={isLoading ? "animate-spin" : ""} />
                        {isLoading ? "Thinking..." : error ? "Try again" : "Reexplain"}
                    </button>
                </div>
                <div className="p-4">
                    <p className="text-base font-medium text-white mb-2">
                        What is Token Gating
                    </p>
                    <div className="min-h-[48px] w-[280px]"> {/* Fixed width container */}
                        {isLoading ? (
                            <LoadingSkeleton />
                        ) : (
                            <p className="text-sm text-white/70 transition-opacity duration-200">
                                {explanation}
                            </p>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default TokenGatingTooltip;