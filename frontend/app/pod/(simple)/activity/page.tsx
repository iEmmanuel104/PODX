// app/pod/(simple)/activity/page.tsx
'use client';

import React, { useState } from 'react';
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
import Telegram from '@/public/icons/socials/Telegram';
import Link from 'next/link';
import Farcaster from '@/public/icons/socials/Farcaster';
import X from '@/public/icons/socials/X';
import { useAppSelector } from '@/store/hooks';

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

// Create an array of 4 identical sessions for demo purposes
const sessions = Array(4).fill(session);

export default function Page() {
    const { isLoggedIn, user } = useAppSelector(state => state.user);
    const [activeTab, setActiveTab] = useState<TabType>('tips');
    const [isBalanceHidden, setIsBalanceHidden] = useState(false);

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-[#151515] text-white p-8 flex items-center justify-center">
                Please log in to view session activity
            </div>
        );
    }

    return (
        <>
            {/* Wallet Info */}
            <div className="flex flex-col items-center gap-4 mb-16">
                <div className="flex items-center gap-2">
                    <span className="text-5xl font-bold bg-gradient-to-r from-[#552FC9] to-[#D7B35D] bg-clip-text text-transparent">
                        {isBalanceHidden ? '******' : '0 USDC'}
                    </span>
                    <Button
                        variant="ghost"
                        className="p-1 h-auto hover:bg-white/5"
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
                <div className="flex gap-4 mt-2">
                    <Button className="bg-[#6032F6] hover:bg-[#6032F6]/90 py-5">
                        <Wallet className="h-4 w-4 mr-2" />
                        Load Wallet
                    </Button>
                    <Button
                        variant="outline"
                        className="border-white/10 bg-transparent text-white hover:text-white hover:bg-white/5 py-5"
                    >
                        <ArrowUpRight className="h-4 w-4 mr-2" />
                        Withdraw
                    </Button>
                </div>
            </div>

            {/* Session Activity */}
            <div>
                <h2 className="text-xl mb-6">Session Activity</h2>

                {/* Tabs */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex gap-2">
                        {(['history', 'attendance', 'tips'] as TabType[]).map(tab => (
                            <Button
                                key={tab}
                                variant="ghost"
                                className={`rounded-full px-4 ${
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

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-white/60">Sort by:</span>
                        <div className="bg-white/5 rounded-lg px-3 py-1.5">
                            <Select defaultValue="newest">
                                <SelectTrigger className="w-[160px] bg-transparent border-0 p-0 h-auto focus:ring-0">
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

                {/* Table */}
                <div className="rounded-lg border border-white/10 overflow-hidden">
                    <table className="w-full">
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
                                <tr key={index} className="text-sm">
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
            </div>

            {/* footer section */}
            <div className="w-full flex justify-between items-center mx-auto mt-10">
                <span className="bg-gradient-to-r from-[#D7B35D] to-[#552FC9] text-transparent bg-clip-text font-medium text-sm">
                    Podx @ {new Date().getFullYear()}
                </span>

                <div className="socials flex gap-[8px]">
                    <a
                        href="https://t.me/podx_fun"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Join us on Telegram"
                        className="social-icon h-[24px] w-[24px]"
                    >
                        <Telegram />
                    </a>
                    <Link href="#" className="text-zinc-400 hover:text-zinc-100 transition-colors">
                        <Farcaster />
                    </Link>
                    <a
                        href="https://x.com/podx_fun"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Follow us on X"
                        className="social-icon h-[24px] w-[24px]"
                    >
                        <X />
                    </a>
                </div>
            </div>
        </>
    );
}
