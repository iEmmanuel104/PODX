// components/join/not-whitelisted-screen.tsx
'use client';
import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';

interface NotWhitelistedScreenProps {
    title: string;
    creator?: {
        username: string | null;
    };
}

export const NotWhitelistedScreen: React.FC<NotWhitelistedScreenProps> = ({ title, creator }) => {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#151515] text-white">
            <div className="container mx-auto px-4 py-6 sm:py-8 md:py-12 flex flex-col min-h-screen">
                <div className="flex-grow flex flex-col items-center justify-center">

                    <div className="max-w-md mx-auto text-center space-y-6">
                        <div className="p-4 rounded-full bg-[#2C2C2C] inline-flex">
                            <svg
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                className="text-[#6032F6]"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-bold">Private Session</h1>

                        <div className="space-y-2">
                            <p className="text-lg text-gray-400">"{title}" is a private session</p>
                            <p className="text-sm text-gray-500">
                                Created by {creator?.username || 'Unknown'}
                            </p>
                        </div>

                        <p className="text-gray-400">
                            You need to be whitelisted by the host to join this session.
                        </p>

                        <button
                            onClick={() => router.push('/pod')}
                            className="mt-6 px-6 py-2 bg-[#2C2C2C] hover:bg-[#3C3C3C] rounded-[10px] text-white transition-colors"
                        >
                            Return to Pod
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotWhitelistedScreen;
