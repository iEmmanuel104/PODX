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
import Logo from '@/components/ui/logo';
import Telegram from '@/public/icons/socials/Telegram';
import Link from 'next/link';
import Farcaster from '@/public/icons/socials/Farcaster';
import X from '@/public/icons/socials/X';
import UserProfile from './userProfile';
import { UserInfo } from '@/store/api/userApi';
import Image from 'next/image';

type TabType = 'history' | 'attendance' | 'tips';

interface Session {
    date: string;
    sessionName: string;
    sessionId: string;
    sessionType: 'Attendee' | 'Host';
    duration: string;
    poaStatus: 'Received';
    tipReceived: string;
    tipSent: string;
}

const sessions: Session[] = [
    {
        date: '2024-09-21',
        sessionName: 'PodX Session',
        sessionId: 'rhy-loph-hew',
        sessionType: 'Attendee',
        duration: '23:09:23',
        poaStatus: 'Received',
        tipReceived: '0 USDC',
        tipSent: '0 USDC',
    },
    {
        date: '2024-09-21',
        sessionName: 'PodX Session',
        sessionId: 'rhy-loph-hew',
        sessionType: 'Attendee',
        duration: '23:09:23',
        poaStatus: 'Received',
        tipReceived: '0 USDC',
        tipSent: '0 USDC',
    },
    {
        date: '2024-09-21',
        sessionName: 'PodX Session',
        sessionId: 'rhy-loph-hew',
        sessionType: 'Attendee',
        duration: '23:09:23',
        poaStatus: 'Received',
        tipReceived: '0 USDC',
        tipSent: '0 USDC',
    },
    {
        date: '2024-09-21',
        sessionName: 'PodX Session',
        sessionId: 'rhy-loph-hew',
        sessionType: 'Attendee',
        duration: '23:09:23',
        poaStatus: 'Received',
        tipReceived: '0 USDC',
        tipSent: '0 USDC',
    },
];


export function SessionActivity({ user }: { user: UserInfo | null }) {
    const [activeTab, setActiveTab] = useState<TabType>('tips');
    const [isBalanceHidden, setIsBalanceHidden] = useState(false);

    return (
        <div className="min-h-screen bg-[#151515] text-white p-8">
            <div className="max-w-[800px] mx-auto">
                {/* Header */}
                <div className="w-full flex justify-center pt-8">
                    <Logo />
                </div>

                <div className="w-1/2 mx-auto flex flex-col gap-14">
                    {/* username and base */}
                    <div className="flex items-center justify-between ">
                        <React.Suspense fallback={<div className="h-12" />}>
                            {user ? (
                                <UserProfile user={user} />
                            ) : (
                                <div>Loading user profile...</div>
                            )}
                        </React.Suspense>

                        <div className="flex items-center gap-2">
                            <Image
                                src="/images/base.png"
                                alt="Base logo"
                                width={14}
                                height={14}
                                className="h-6 w-6"
                            />
                            <span className="text-lg font-medium">Base</span>
                        </div>
                    </div>

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
                </div>

                {/* Session Activity */}
                <div>
                    <h2 className="text-xl mb-6">Session Activity</h2>

                    {/* Tabs */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                className={`rounded-full px-4 ${
                                    activeTab === 'history'
                                        ? 'bg-[#DDB958] text-black'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                                onClick={() => setActiveTab('history')}
                            >
                                Session history
                            </Button>
                            <Button
                                variant="ghost"
                                className={`rounded-full px-4 ${
                                    activeTab === 'attendance'
                                        ? 'bg-[#DDB958] text-black'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                                onClick={() => setActiveTab('attendance')}
                            >
                                Proof of attendance
                            </Button>
                            <Button
                                variant="ghost"
                                className={`rounded-full px-4 ${
                                    activeTab === 'tips'
                                        ? 'bg-[#DDB958] text-black'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                                onClick={() => setActiveTab('tips')}
                            >
                                Tip history
                            </Button>
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
                        <Link
                            href="#"
                            className="text-zinc-400 hover:text-zinc-100 transition-colors"
                        >
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
            </div>
        </div>
    );
}
