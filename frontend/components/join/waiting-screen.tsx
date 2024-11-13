import React from "react";

const WaitingScreen = () => (
    <div
        className="w-full min-h-screen flex flex-col items-center justify-center 
                    text-white bg-[#121212] px-4 sm:px-6"
    >
        <div className="max-w-md w-full text-center space-y-6">
            <p className="text-base sm:text-lg md:text-xl font-medium">Please wait while we prepare your pod meeting experience.</p>

            <div className="animate-pulse text-[#6032f6]">
                <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
            </div>

            <p className="text-xs sm:text-sm text-gray-400">You'll be joining the meeting shortly...</p>
        </div>
    </div>
);

export default WaitingScreen;
