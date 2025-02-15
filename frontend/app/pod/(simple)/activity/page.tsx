// app/pod/(simple)/activity/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
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
    Image as ImageIcon,
    ExternalLink,
    Loader2,
    Calendar,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useTypedSelector } from '@/store/config/store';
import { useGetUserCallsQuery } from '@/store/user/slice';
import { useWalletOperations } from '@/hooks/useWalletOps';
import { useBalance } from 'wagmi';
import { formatDate, formatDuration } from '@/lib/utils';

type TabType = 'history' | 'tips';
interface POA {
    image: string;
    transaction: string;
}

const POADialog = ({ poa }: { poa: POA }) => (
    <Dialog>
        <DialogTrigger asChild>
            <Button variant="link" className="text-[#69CB58] p-0 h-auto">
                Received POA
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md bg-[#1E1E1E] border-white/10">
            <DialogHeader>
                <DialogTitle>Proof of Attendance</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
                <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-white/10">
                    <img src={poa.image} alt="POA NFT" className="object-cover" />
                </div>
                <div className="flex gap-3">
                    <Button
                        className="flex-1 bg-[#6032F6] hover:bg-[#6032F6]/90"
                        onClick={() => {
                            const link = document.createElement('a');
                            link.href = poa.image;
                            link.download = 'poa-nft.png';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                    >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Download Image
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1 border-white/10 hover:bg-white/5"
                        onClick={() => window.open(poa.transaction, '_blank')}
                    >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Transaction
                    </Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
);

// Mobile Session Card Component
const SessionCard = ({ session, type }: { session: any; type: TabType }) => {
    const { date, time } = formatDate(session.startTime ?? '');

    return (
        <div className="bg-white/5 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="font-medium">{session.custom?.title}</div>
                    <div className="text-sm text-white/60 flex items-center gap-1 mt-1">
                        <LinkIcon className="h-3 w-3" />
                        {session.callId}
                    </div>
                </div>
                <div className="text-right text-sm">
                    <div>{date}</div>
                    <div className="text-white/60">{time}</div>
                </div>
            </div>

            {type === 'history' ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <div className="text-white/60 mb-1">Type</div>
                        <span className="px-2 py-1 rounded-full bg-white/10 text-sm">
                            {session.custom?.type || '-'}
                        </span>
                    </div>
                    <div>
                        <div className="text-white/60 mb-1">Duration</div>
                        <div>{formatDuration(session.duration ?? 0)}</div>
                    </div>
                    <div className="col-span-2">
                        <div className="text-white/60 mb-1">POA Status</div>
                        {session.poa ? (
                            <POADialog poa={session.poa} />
                        ) : (
                            <span className="text-white/60">-</span>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <div className="text-white/60 mb-1">Received</div>
                        <div>0 USDC</div>
                    </div>
                    <div>
                        <div className="text-white/60 mb-1">Sent</div>
                        <div>0 USDC</div>
                    </div>
                    <div className="col-span-2">
                        <Button
                            variant="link"
                            className="text-white underline hover:text-white/90 p-0 h-auto"
                        >
                            View transaction
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Empty State Component
const EmptyState = ({ type }: { type: TabType }) => (
    <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-white/40" />
        </div>
        <h3 className="text-xl font-medium text-white mb-2">
            No {type === 'history' ? 'sessions' : 'tips'} yet
        </h3>
        <p className="text-white/60 text-center max-w-md">
            {type === 'history'
                ? 'Join or create a session to start building your activity history.'
                : 'Send or receive tips during sessions to see them here.'}
        </p>
    </div>
);

// Main Component
export default function Page() {
    const [activeTab, setActiveTab] = useState<TabType>('history');
    const [isBalanceHidden, setIsBalanceHidden] = useState(false);
    const [tokenGatingSwitch] = useState(true);

    // Get user info from auth hook
    const { user } = useTypedSelector(state => state.auth);
    const isPrivyWallet = user?.walletType === 'privy';
    const { getActiveWalletAddress } = useWalletOperations();

    // Only get wallet address if it's a Privy wallet
    const activeWalletAddress = useMemo(
        () => (isPrivyWallet ? getActiveWalletAddress() : undefined),
        [isPrivyWallet, getActiveWalletAddress]
    );

    // Balance fetching
    const { data: balance, isLoading: isLoadingBalance } = useBalance({
        address: activeWalletAddress as `0x${string}`,
    });

    const displayBalance = useMemo(() => {
        if (!balance) return '0.0000';
        const formattedBalance = Number(balance.value) / 1e18;
        return formattedBalance.toFixed(4);
    }, [balance]);

    const usdValue = useMemo(() => {
        if (!balance) return '0.00';
        const ethPrice = 3000;
        const formattedBalance = Number(balance.value) / 1e18;
        return (formattedBalance * ethPrice).toFixed(2);
    }, [balance]);

    // Fetch user calls data
    const { data: userCallsData, isLoading: isLoadingCalls } = useGetUserCallsQuery(
        { filter: undefined },
        { skip: !tokenGatingSwitch }
    );

    const sessions = userCallsData?.data?.calls || [];

    return (
        <div className="w-full flex flex-col gap-6">
            {/* Wallet Info Section */}
            {isPrivyWallet && (
                <div className="w-full flex flex-col items-center gap-4 p-4 sm:p-6 rounded-xl bg-white/5">
                    <div className="flex items-center gap-2">
                        {isLoadingBalance ? (
                            <Loader2 className="h-6 w-6 animate-spin text-white/60" />
                        ) : (
                            <span className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#552FC9] to-[#D7B35D] bg-clip-text text-transparent">
                                {isBalanceHidden ? '****' : `${displayBalance} ETH`}
                            </span>
                        )}
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
                        {isBalanceHidden ? '****' : `~USD ${usdValue}`}
                    </div>

                    <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 mt-2">
                        <Button className="bg-[#6032F6] hover:bg-[#6032F6]/90 py-3 w-full sm:w-auto">
                            <Wallet className="h-4 w-4 mr-2" />
                            Load Wallet
                        </Button>
                        <Button
                            variant="outline"
                            className="border-white/10 hover:bg-white/5 py-3 w-full sm:w-auto"
                        >
                            <ArrowUpRight className="h-4 w-4 mr-2" />
                            Withdraw
                        </Button>
                    </div>
                </div>
            )}

            {/* Session Activity Section */}
            <div className="w-full">
                {/* Header with Sort - Desktop */}
                <div className="hidden sm:flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold">Session Activity</h2>
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

                {/* Header with Sort - Mobile */}
                <div className="sm:hidden space-y-4 mb-6">
                    <h2 className="text-xl font-semibold">Session Activity</h2>
                    <div className="bg-white/5 rounded-lg px-3 py-1.5 w-full">
                        <Select defaultValue="newest">
                            <SelectTrigger className="w-full bg-transparent border-0 p-0 h-auto focus:ring-0">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1E1E1E] border-white/10">
                                <SelectItem value="newest">Newest session</SelectItem>
                                <SelectItem value="oldest">Oldest session</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Tabs - Always Visible */}
                <div className="flex gap-2 mb-6">
                    {(['history', 'tips'] as TabType[]).map(tab => (
                        <Button
                            key={tab}
                            variant="ghost"
                            className={`rounded-full px-4 py-2 text-sm ${
                                activeTab === tab
                                    ? 'bg-[#DDB958] text-black'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab === 'history' ? 'Session history' : 'Tip history'}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Table Section */}
            <div className="w-full rounded-lg border border-white/10 overflow-hidden">
                {isLoadingCalls ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-white/60" />
                    </div>
                ) : sessions.length === 0 ? (
                    <EmptyState type={activeTab} />
                ) : (
                    <>
                        {/* Desktop View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/5">
                                    <tr className="text-left text-sm text-white/60">
                                        {activeTab === 'history' ? (
                                            <>
                                                <th className="p-4">Date</th>
                                                <th className="p-4">Session name</th>
                                                <th className="p-4">Session type</th>
                                                <th className="p-4">Duration</th>
                                                <th className="p-4">POA Status</th>
                                            </>
                                        ) : (
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
                            </table>

                            {/* Scrollable Body */}
                            <div className="overflow-y-auto max-h-[460px]">
                                <table className="w-full">
                                    <tbody className="divide-y divide-white/10">
                                        {sessions.map(session => {
                                            const { date, time } = formatDate(
                                                session.startTime ?? ''
                                            );
                                            return (
                                                <tr
                                                    key={session._id}
                                                    className="text-sm hover:bg-white/5 transition-colors duration-200"
                                                >
                                                    {activeTab === 'history' ? (
                                                        <>
                                                            <td className="p-4">
                                                                <div>{date}</div>
                                                                <div className="text-white/60">
                                                                    {time}
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                <div>
                                                                    {
                                                                        session.custom
                                                                            ?.title as string
                                                                    }
                                                                </div>
                                                                <div className="text-white/60 flex items-center gap-1">
                                                                    <LinkIcon className="h-3 w-3" />
                                                                    {session.callId}
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                <span className="px-2 py-1 rounded-full bg-white/10">
                                                                    {(session.custom
                                                                        ?.type as string) || '-'}
                                                                </span>
                                                            </td>
                                                            <td className="p-4">
                                                                {formatDuration(
                                                                    session.duration ?? 0
                                                                )}
                                                            </td>
                                                            <td className="p-4">
                                                                {session.poa ? (
                                                                    <POADialog poa={session.poa} />
                                                                ) : (
                                                                    <span className="text-white/60">
                                                                        -
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="p-4">
                                                                <div>{date}</div>
                                                                <div className="text-white/60">
                                                                    {time}
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                <div>
                                                                    {
                                                                        session.custom
                                                                            ?.title as string
                                                                    }
                                                                </div>
                                                                <div className="text-white/60 flex items-center gap-1">
                                                                    <ArrowUturnLeft className="h-3 w-3" />
                                                                    {session.callId}
                                                                </div>
                                                            </td>
                                                            <td className="p-4">0 USDC</td>
                                                            <td className="p-4">0 USDC</td>
                                                            <td className="p-4">
                                                                <Button
                                                                    variant="link"
                                                                    className="text-white underline hover:text-white/90 p-0 h-auto"
                                                                >
                                                                    View transaction
                                                                </Button>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        {/* Mobile View - Card Layout */}
                        <div className="md:hidden">
                            {sessions.map(session => (
                                <SessionCard key={session._id} session={session} type={activeTab} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
