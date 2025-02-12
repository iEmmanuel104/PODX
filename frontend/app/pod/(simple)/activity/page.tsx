// app/pod/(simple)/activity/page.tsx
'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ArrowUpRight,
    ArrowUpLeftIcon as ArrowUturnLeft,
    Eye,
    EyeOff,
    LinkIcon,
    Wallet,
} from 'lucide-react';

type TabType = 'history' | 'attendance' | 'tips';

// Simplified session data
const session = {
    date: '2024-09-21',
    sessionName: 'PodX Session',
    sessionId: 'rhy-loph-hew',
    sessionType: 'Attendee',
    duration: '23:09:23',
    poaStatus: 'Received',
    tipReceived: '0 USDC',
    tipSent: '0 USDC',
};

const RetroGrid = dynamic(() => import('@/components/ui/retro-grid'));

// Create an array of 4 identical sessions for demo purposes
const sessions = Array(4).fill(session);

export default function Page() {
    const [activeTab, setActiveTab] = useState<TabType>('tips');
    const [isBalanceHidden, setIsBalanceHidden] = useState(false);

    return (
        <div className="w-full flex flex-col gap-8 transition-all duration-200">
            {/* Wallet Info Section */}
            <div className="w-full flex flex-col items-center gap-4 p-4 sm:p-6 rounded-xl">
                <div className="flex items-center gap-2">
                    <span className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-[#552FC9] to-[#D7B35D] bg-clip-text text-transparent transition-all duration-200">
                        {isBalanceHidden ? '****' : '0 USDC'}
                    </span>
                    <Button
                        variant="ghost"
                        className="p-1 h-auto hover:bg-white/5 transition-all duration-200"
                        onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                    >
                        {isBalanceHidden ? (
                            <EyeOff className="h-4 w-4 text-white/60" />
                        ) : (
                            <Eye className="h-4 w-4 text-white/60" />
                        )}
                    </Button>
                </div>
                <div className="text-sm text-white/60">
                    {isBalanceHidden ? '****' : '~USD 50.01'}
                </div>
                <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 sm:gap-4 mt-2">
                    <Button className="bg-[#6032F6] hover:bg-[#6032F6]/90 py-3 sm:py-5 w-full sm:w-auto transition-all duration-200">
                        <Wallet className="h-4 w-4 mr-2" />
                        Load Wallet
                    </Button>
                    <Button
                        variant="outline"
                        className="border-white/10 bg-transparent text-white hover:text-white hover:bg-white/5 py-3 sm:py-5 w-full sm:w-auto transition-all duration-200"
                    >
                        <ArrowUpRight className="h-4 w-4 mr-2" />
                        Withdraw
                    </Button>
                </div>
            </div>

            {/* Session Activity Section */}
            <div className="w-full rounded-xl p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-semibold mb-6">Session Activity</h2>

                {/* Tabs and Sort Section */}
                <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center mb-6">
                    {/* Tabs */}
                    <div className="flex flex-wrap gap-2">
                        {(['history', 'attendance', 'tips'] as TabType[]).map(tab => (
                            <Button
                                key={tab}
                                variant="ghost"
                                className={`rounded-full px-3 sm:px-4 py-2 text-sm transition-all duration-200 ${
                                    activeTab === tab
                                        ? 'bg-[#DDB958] text-black'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab === 'history'
                                    ? 'Session history'
                                    : tab === 'attendance'
                                      ? 'Proof of attendance'
                                      : 'Tip history'}
                            </Button>
                        ))}
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className="text-sm text-white/60 hidden sm:inline">Sort by:</span>
                        <div className="bg-white/5 rounded-lg px-3 py-1.5">
                            <Select defaultValue="newest">
                                <SelectTrigger className="w-[140px] sm:w-[160px] bg-transparent border-0 p-0 h-auto focus:ring-0">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1E1E1E] border-white/10">
                                    <SelectItem value="newest">Newest session</SelectItem>
                                    <SelectItem value="oldest">Oldest session</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="rounded-lg border border-white/10 overflow-x-auto">
                    <table className="w-full whitespace-nowrap">
                        <thead className="bg-white/5">
                            <tr className="text-left text-sm text-white/60">
                                {activeTab === 'history' && (
                                    <>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Session name</th>
                                        <th className="p-4">Session type</th>
                                        <th className="p-4">Session Duration</th>
                                        <th className="p-4">Proof of Attendance</th>
                                    </>
                                )}
                                {activeTab === 'attendance' && (
                                    <>
                                        <th className="p-4">Session name</th>
                                        <th className="p-4">Session ID</th>
                                        <th className="p-4">POA status</th>
                                        <th className="p-4">Session type</th>
                                        <th className="p-4">Proof of Attendance</th>
                                    </>
                                )}
                                {activeTab === 'tips' && (
                                    <>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Session ID</th>
                                        <th className="p-4">Tip received</th>
                                        <th className="p-4">Tip sent</th>
                                        <th className="p-4">Transaction</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {sessions.map((session, index) => (
                                <tr
                                    key={index}
                                    className="text-sm hover:bg-white/5 transition-colors duration-200"
                                >
                                    {activeTab === 'history' && (
                                        <>
                                            <td className="p-4">
                                                <div>{session.date}</div>
                                                <div className="text-white/60">9:00PM</div>
                                            </td>
                                            <td className="p-4">
                                                <div>{session.sessionName}</div>
                                                <div className="text-white/60 flex items-center gap-1">
                                                    <LinkIcon className="h-3 w-3" />
                                                    {session.sessionId}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 rounded-full bg-white/10">
                                                    {session.sessionType}
                                                </span>
                                            </td>
                                            <td className="p-4">{session.duration}</td>
                                            <td className="p-4 text-[#69CB58]">Received POA</td>
                                        </>
                                    )}
                                    {activeTab === 'attendance' && (
                                        <>
                                            <td className="p-4">
                                                <div>{session.sessionName}</div>
                                                <div className="text-white/60 flex items-center gap-1">
                                                    <LinkIcon className="h-3 w-3" />
                                                    {session.sessionId}
                                                </div>
                                            </td>
                                            <td className="p-4">{session.sessionId}</td>
                                            <td className="p-4 text-[#69CB58]">
                                                {session.poaStatus}
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 rounded-full bg-white/10">
                                                    {session.sessionType}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <Button
                                                    variant="link"
                                                    className="text-[#6032F6] p-0 h-auto"
                                                >
                                                    View transaction
                                                </Button>
                                            </td>
                                        </>
                                    )}
                                    {activeTab === 'tips' && (
                                        <>
                                            <td className="p-4">
                                                <div>{session.date}</div>
                                                <div className="text-white/60">9:00PM</div>
                                            </td>
                                            <td className="p-4">
                                                <div>{session.sessionName}</div>
                                                <div className="text-white/60 flex items-center gap-1">
                                                    <ArrowUturnLeft className="h-3 w-3" />
                                                    {session.sessionId}
                                                </div>
                                            </td>
                                            <td className="p-4">{session.tipReceived}</td>
                                            <td className="p-4">{session.tipSent}</td>
                                            <td className="p-4">
                                                <a
                                                    href="#"
                                                    className="text-white underline hover:text-white/90"
                                                >
                                                    View transaction
                                                </a>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Mobile-optimized view for very small screens */}
                <div className="sm:hidden mt-4">
                    <p className="text-sm text-white/60">↔️ Scroll horizontally to view all data</p>
                </div>
            </div>

            {/* Background Grid - Moved to bottom of stack */}
            <div className="absolute inset-0 w-full overflow-hidden pointer-events-none">
                <RetroGrid />
            </div>
        </div>
    );
}
