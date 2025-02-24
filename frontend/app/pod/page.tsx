'use client';

import { useState } from 'react';
import Header from '@/components/common/Header';

interface Session {
    id: string;
    name: string;
    date: string;
}

export default function PodPage() {
    const [sessionId, setSessionId] = useState('');
    
    const handleJoinSession = (id?: string) => {
        // Your join session logic
    };

    const handleCreateSession = () => {
        // Your create session logic
    };

    // Mock data - replace with your actual data
    const recentSessions: Session[] = [
        // Your sessions data
    ];

    return (
        <div className="min-h-screen bg-[#151515] text-white">
            {/* Main container with proper padding and width constraints */}
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-full">
                {/* Header section */}
                <div className="pt-6 sm:pt-8">
                    <Header />
                </div>

                {/* Content section with responsive grid */}
                <div className="mt-8 sm:mt-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {/* Join Session Card */}
                        <div className="w-full bg-[#1A1A1A] rounded-2xl p-4 sm:p-6">
                            <div className="flex flex-col gap-4">
                                <h2 className="text-xl sm:text-2xl font-semibold">
                                    Join Session
                                </h2>
                                <input
                                    type="text"
                                    placeholder="Enter session ID"
                                    value={sessionId}
                                    onChange={(e) => setSessionId(e.target.value)}
                                    className="w-full bg-[#2C2C2C] text-white rounded-xl px-4 py-3 
                                    text-sm focus:outline-none focus:ring-2 focus:ring-[#6032F6]"
                                />
                                <button
                                    onClick={() => handleJoinSession()}
                                    disabled={!sessionId}
                                    className="w-full bg-[#6032F6] hover:bg-[#4C28C4] disabled:bg-gray-600 
                                    text-white rounded-xl py-3 transition-colors duration-200"
                                >
                                    Join
                                </button>
                            </div>
                        </div>

                        {/* Create Session Card */}
                        <div className="w-full bg-[#1A1A1A] rounded-2xl p-4 sm:p-6">
                            <div className="flex flex-col gap-4">
                                <h2 className="text-xl sm:text-2xl font-semibold">
                                    Create Session
                                </h2>
                                <p className="text-gray-400 text-sm">
                                    Start a new session and invite others to join
                                </p>
                                <button
                                    onClick={handleCreateSession}
                                    className="w-full bg-[#6032F6] hover:bg-[#4C28C4] 
                                    text-white rounded-xl py-3 transition-colors duration-200"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Sessions section */}
                <div className="mt-8 sm:mt-12 pb-8">
                    <h2 className="text-xl sm:text-2xl font-semibold mb-4">
                        Recent Sessions
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentSessions.map((session) => (
                            <div
                                key={session.id}
                                className="bg-[#1A1A1A] rounded-xl p-4 cursor-pointer 
                                hover:bg-[#242424] transition-colors duration-200"
                                onClick={() => handleJoinSession(session.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">
                                        {session.name}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {session.date}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
} 