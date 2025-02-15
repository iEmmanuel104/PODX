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

type TabType = 'history' | 'tips';

const RetroGrid = dynamic(() => import('@/components/ui/retro-grid'));

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
};

const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

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

export default function Page() {
    const [activeTab, setActiveTab] = useState<TabType>('history');
    const [isBalanceHidden, setIsBalanceHidden] = useState(false);
    const [tokenGatingSwitch] = useState(true);

    // Get user info from auth hook
    const { user } = useTypedSelector(state => state.auth);
    // Check if it's a Privy wallet
    const isPrivyWallet = user?.walletType === 'privy';

    const { getActiveWalletAddress } = useWalletOperations();

    // Only get wallet address if it's a Privy wallet
    const activeWalletAddress = useMemo(
        () => (isPrivyWallet ? getActiveWalletAddress() : undefined),
        [isPrivyWallet, getActiveWalletAddress]
    );

    // Only fetch balance for Privy wallets
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
        const ethPrice = 3000; // Example price
        const formattedBalance = Number(balance.value) / 1e18;
        return (formattedBalance * ethPrice).toFixed(2);
    }, [balance]);

    const { data: userCallsData, isLoading: isLoadingCalls } = useGetUserCallsQuery(
        { filter: undefined },
        {
            skip: !tokenGatingSwitch,
        }
    );

    const sessions = userCallsData?.data?.calls || [];

    return (
        <div className="w-full flex flex-col gap-8 transition-all duration-200">
            {/* Wallet Info Section - Only show for Privy wallets */}
            {isPrivyWallet && (
                <div className="w-full flex flex-col items-center gap-4 p-4 sm:p-6 rounded-xl">
                    <div className="flex items-center gap-2">
                        {isLoadingBalance ? (
                            <Loader2 className="h-6 w-6 animate-spin text-white/60" />
                        ) : (
                            <span className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-[#552FC9] to-[#D7B35D] bg-clip-text text-transparent transition-all duration-200">
                                {isBalanceHidden ? '****' : `${displayBalance} ETH`}
                            </span>
                        )}
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
                        {isBalanceHidden ? '****' : `~USD ${usdValue}`}
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
            )}

            {/* Session Activity Section */}
            <div className="w-full rounded-xl p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-semibold mb-6">Session Activity</h2>

                {/* Tabs and Sort Section */}
                <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center mb-6">
                    <div className="flex flex-wrap gap-2">
                        {(['history', 'tips'] as TabType[]).map(tab => (
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
                                {tab === 'history' ? 'Session history' : 'Tip history'}
                            </Button>
                        ))}
                    </div>

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
                    {isLoadingCalls ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin text-white/60" />
                        </div>
                    ) : (
                        <table className="w-full whitespace-nowrap">
                            <thead className="bg-white/5">
                                <tr className="text-left text-sm text-white/60">
                                    {activeTab === 'history' && (
                                        <>
                                            <th className="p-4">Date</th>
                                            <th className="p-4">Session name</th>
                                            <th className="p-4">Session type</th>
                                            <th className="p-4">Session Duration</th>
                                            <th className="p-4">POA Status</th>
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
                                {sessions.map(session => {
                                    const { date, time } = formatDate(session.startTime ?? '');
                                    return (
                                        <tr
                                            key={session._id}
                                            className="text-sm hover:bg-white/5 transition-colors duration-200"
                                        >
                                            {activeTab === 'history' && (
                                                <>
                                                    <td className="p-4">
                                                        <div>{date}</div>
                                                        <div className="text-white/60">{time}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div>{session.custom?.title as string}</div>
                                                        <div className="text-white/60 flex items-center gap-1">
                                                            <LinkIcon className="h-3 w-3" />
                                                            {session.callId}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="px-2 py-1 rounded-full bg-white/10">
                                                            {(session.custom?.type as string) ||
                                                                '-'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        {formatDuration(session.duration ?? 0)}
                                                    </td>
                                                    <td className="p-4">
                                                        {session.poa ? (
                                                            <POADialog poa={session.poa} />
                                                        ) : (
                                                            <span className="text-white/60">-</span>
                                                        )}
                                                    </td>
                                                </>
                                            )}
                                            {activeTab === 'tips' && (
                                                <>
                                                    <td className="p-4">
                                                        <div>{date}</div>
                                                        <div className="text-white/60">{time}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div>{session.custom?.title as string}</div>
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
                    )}
                </div>
                <div className="sm:hidden mt-4">
                    <p className="text-sm text-white/60">↔️ Scroll horizontally to view all data</p>
                </div>
            </div>

            <div className="absolute inset-0 w-full overflow-hidden pointer-events-none">
                <RetroGrid />
            </div>
        </div>
    );
}
