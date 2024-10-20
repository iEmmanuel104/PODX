import React from "react";

const WaitingScreen: React.FC = () => (
    <div className="w-full h-screen flex flex-col items-center justify-center text-center bg-gray-100">
        <p className="text-lg mb-6">Please wait while we prepare your pod meeting experience.</p>
        <div className="animate-pulse text-blue-500">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
        </div>
        <p className="mt-4 text-sm text-gray-600">You'll be joining the meeting shortly...</p>
    </div>
);

export default WaitingScreen;
