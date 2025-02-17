// app/pod/(simple)/activity/page.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowUpRight, ArrowLeft, Eye, EyeOff, LinkIcon, Wallet, Loader2 } from 'lucide-react';
import { useTypedSelector } from '@/store/config/store';
import { useGetUserCallsQuery, useGetUserTipHistoryQuery } from '@/store/user/slice';
import { useRouter } from 'next/navigation';
import { useWalletOperations } from '@/hooks/useWalletOps';
import { useBalance } from 'wagmi';
import { formatDate, formatDuration } from '@/lib/utils';
import { Call, Tip } from '@/store/user/types';
import { TabType } from '@/types';
import { POADialog, SessionCard, EmptyState } from '@/components/activity/activity-props';
import { useSendTransaction } from '@privy-io/react-auth';
import { ethers, parseEther, parseUnits } from 'ethers';
import { WithdrawModal } from '@/components/activity/withdraw-modal';
import { erc20Abi } from 'viem';
import { USDC_CONTRACT_ADDRESS, USDC_DECIMALS } from '@/hooks/useTipping';

// Main Component
export default function Page() {
    const [activeTab, setActiveTab] = useState<TabType>('history');
    const [isBalanceHidden, setIsBalanceHidden] = useState(false);
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

    // Auth and wallet state
    const { user } = useTypedSelector(state => state.auth);
    const isPrivyWallet = user?.walletType === 'privy';
    const { getActiveWalletAddress } = useWalletOperations();
    const { sendTransaction } = useSendTransaction();

    // Get wallet address for Privy wallets
    const activeWalletAddress = useMemo(
        () => (isPrivyWallet ? getActiveWalletAddress() : undefined),
        [isPrivyWallet, getActiveWalletAddress]
    );

    // Query configuration
    const queryConfig = useMemo(
        () => ({
            refetchOnMountOrArgChange: true,
            refetchOnReconnect: true,
            refetchOnFocus: true,
        }),
        []
    );

    // Fetch data with optimized queries
    const {
        data: userCallsData,
        isLoading: isLoadingCalls,
        refetch: refetchCalls,
    } = useGetUserCallsQuery({ filter: undefined }, queryConfig);

    const {
        data: tipHistoryData,
        isLoading: isLoadingTips,
        refetch: refetchTips,
    } = useGetUserTipHistoryQuery(undefined, queryConfig);

    // Fetch balance
    const { data: balance, isLoading: isLoadingBalance } = useBalance({
        address: activeWalletAddress as `0x${string}`,
        // enabled: isPrivyWallet,
    });

    // Effect to trigger initial data load
    useEffect(() => {
        if (user?.id) {
            refetchCalls();
            refetchTips();
        }
    }, [user?.id, refetchCalls, refetchTips]);

    // Memoized data processing
    const displayBalance = useMemo(() => {
        if (!balance) return '0.0000';
        return (Number(balance.value) / 1e18).toFixed(4);
    }, [balance]);

    const usdValue = useMemo(() => {
        if (!balance) return '0.00';
        const ethPrice = 3000; // Consider fetching this from an API
        return ((Number(balance.value) / 1e18) * ethPrice).toFixed(2);
    }, [balance]);

    // Sort and process data
    const sortedData = useMemo(() => {
        const data =
            activeTab === 'history'
                ? userCallsData?.data?.calls || []
                : tipHistoryData?.data?.tips || [];

        const isCall = (item: Call | Tip): item is Call =>
            'startTime' in item && !('timestamp' in item);

        return [...data].sort((a, b) => {
            const dateA = new Date(isCall(a) ? (a.startTime ?? '') : (a.timestamp ?? ''));
            const dateB = new Date(isCall(b) ? (b.startTime ?? '') : (b.timestamp ?? ''));
            return sortOrder === 'newest'
                ? dateB.getTime() - dateA.getTime()
                : dateA.getTime() - dateB.getTime();
        });
    }, [activeTab, userCallsData, tipHistoryData, sortOrder]);

    // Withdraw handler
    const handleWithdraw = async (address: string, amount: string, currency: 'ETH' | 'USDC') => {
        try {
            if (currency === 'ETH') {
                await sendTransaction({
                    to: address,
                    value: parseEther(amount),
                    chainId: 8453,
                });
            } else if (currency === 'USDC') {
                const parsedAmount = parseUnits(amount, USDC_DECIMALS);
                const data = new ethers.Interface(erc20Abi).encodeFunctionData('transfer', [
                    address,
                    parsedAmount,
                ]);
                await sendTransaction({
                    to: USDC_CONTRACT_ADDRESS,
                    data,
                    chainId: 8453,
                });
            }
        } catch (error) {
            console.error('Withdrawal failed:', error);
            // Add error handling here
        }
    };

    const router = useRouter();

    // Loading state
    const isLoading =
        (activeTab === 'history' ? isLoadingCalls : isLoadingTips) ||
        (isPrivyWallet && isLoadingBalance);

    const sessions = userCallsData?.data?.calls || [];
    const tips = tipHistoryData?.data?.tips || [];
    const tipSummary = tipHistoryData?.data?.summary;

    return (
        <div className="w-full flex flex-col gap-6">
            {/* Navigation Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full hover:bg-white/5"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold">Back</h1>
            </div>

            {/* Wallet Info Section */}
            {isPrivyWallet && (
                <div className="w-full flex flex-col items-center gap-4 p-4 sm:p-6 rounded-xl">
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
                            className="text-black hover:text-black hover:bg-white/80 border-white/10 py-3 w-full sm:w-auto"
                            onClick={() => setIsWithdrawModalOpen(true)}
                        >
                            <ArrowUpRight className="h-4 w-4 mr-2" />
                            Withdraw
                        </Button>

                        {/* Withdraw Modal */}
                        <WithdrawModal
                            isOpen={isWithdrawModalOpen}
                            onClose={() => setIsWithdrawModalOpen(false)}
                            onWithdraw={handleWithdraw}
                        />
                    </div>
                </div>
            )}

            {/* Session Activity Section */}
            <div className="w-full">
                {/* Header with Sort - Desktop */}
                <div className="hidden sm:flex justify-between items-start mb-6">
                    <div className="flex-1">
                        <h2 className="text-2xl font-semibold">Session Activity</h2>
                        {activeTab === 'tips' && tipSummary && (
                            <div className="mt-4 grid grid-cols-4 gap-4">
                                <div className="bg-white/5 rounded-lg p-4">
                                    <div className="text-sm text-white/60 mb-1">Total Sent</div>
                                    <div className="text-lg font-medium">
                                        {tipSummary.totalSent.toFixed(2)} USDC
                                    </div>
                                    <div className="text-sm text-white/60 mt-1">
                                        {tipSummary.tipsSent} tips
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-4">
                                    <div className="text-sm text-white/60 mb-1">Total Received</div>
                                    <div className="text-lg font-medium">
                                        {tipSummary.totalReceived.toFixed(2)} USDC
                                    </div>
                                    <div className="text-sm text-white/60 mt-1">
                                        {tipSummary.tipsReceived} tips
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-4">
                                    <div className="text-sm text-white/60 mb-1">Net Balance</div>
                                    <div className="text-lg font-medium">
                                        {(tipSummary.totalReceived - tipSummary.totalSent).toFixed(
                                            2
                                        )}{' '}
                                        USDC
                                    </div>
                                    <div className="text-sm text-white/60 mt-1">
                                        {tipSummary.tipsReceived + tipSummary.tipsSent} total tips
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-4">
                                    <div className="text-sm text-white/60 mb-1">Average Tip</div>
                                    <div className="text-lg font-medium">
                                        {(
                                            (tipSummary.totalSent + tipSummary.totalReceived) /
                                            (tipSummary.tipsSent + tipSummary.tipsReceived || 1)
                                        ).toFixed(2)}{' '}
                                        USDC
                                    </div>
                                    <div className="text-sm text-white/60 mt-1">
                                        per transaction
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        <span className="text-sm text-white/60">Sort by:</span>
                        <div className="bg-white/5 rounded-lg px-3 py-1.5">
                            <Select defaultValue="newest">
                                <SelectTrigger className="w-[160px] bg-transparent border-0 p-0 h-auto focus:ring-0">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1E1E1E] border-white/10">
                                    <SelectItem value="newest">
                                        Newest {activeTab === 'history' ? 'session' : 'tip'}
                                    </SelectItem>
                                    <SelectItem value="oldest">
                                        Oldest {activeTab === 'history' ? 'session' : 'tip'}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Header with Sort and Summary - Mobile */}
                <div className="sm:hidden space-y-4 mb-6">
                    <h2 className="text-xl font-semibold">Session Activity</h2>
                    {activeTab === 'tips' && tipSummary && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 rounded-lg p-3">
                                <div className="text-sm text-white/60 mb-1">Total Sent</div>
                                <div className="text-base font-medium">
                                    {tipSummary.totalSent.toFixed(2)} USDC
                                </div>
                                <div className="text-xs text-white/60 mt-1">
                                    {tipSummary.tipsSent} tips
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3">
                                <div className="text-sm text-white/60 mb-1">Total Received</div>
                                <div className="text-base font-medium">
                                    {tipSummary.totalReceived.toFixed(2)} USDC
                                </div>
                                <div className="text-xs text-white/60 mt-1">
                                    {tipSummary.tipsReceived} tips
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3">
                                <div className="text-sm text-white/60 mb-1">Net Balance</div>
                                <div className="text-base font-medium">
                                    {(tipSummary.totalReceived - tipSummary.totalSent).toFixed(2)}{' '}
                                    USDC
                                </div>
                                <div className="text-xs text-white/60 mt-1">
                                    {tipSummary.tipsReceived + tipSummary.tipsSent} total
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3">
                                <div className="text-sm text-white/60 mb-1">Average</div>
                                <div className="text-base font-medium">
                                    {(
                                        (tipSummary.totalSent + tipSummary.totalReceived) /
                                        (tipSummary.tipsSent + tipSummary.tipsReceived || 1)
                                    ).toFixed(2)}{' '}
                                    USDC
                                </div>
                                <div className="text-xs text-white/60 mt-1">per tip</div>
                            </div>
                        </div>
                    )}
                    <div className="bg-white/5 rounded-lg px-3 py-1.5 w-full">
                        <Select defaultValue="newest">
                            <SelectTrigger className="w-full bg-transparent border-0 p-0 h-auto focus:ring-0">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1E1E1E] border-white/10">
                                <SelectItem value="newest">
                                    Newest {activeTab === 'history' ? 'session' : 'tip'}
                                </SelectItem>
                                <SelectItem value="oldest">
                                    Oldest {activeTab === 'history' ? 'session' : 'tip'}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Keep the existing tabs section */}
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
                {(activeTab === 'history' ? isLoadingCalls : isLoadingTips) ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-white/60" />
                    </div>
                ) : (activeTab === 'history' ? sessions.length === 0 : tips.length === 0) ? (
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
                                                <th className="p-4">From</th>
                                                <th className="p-4">To</th>
                                                <th className="p-4">Amount</th>
                                                <th className="p-4">Status</th>
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
                                        {(activeTab === 'history' ? sessions : tips).map(item => {
                                            // Type guard to check if item is a Call or Tip
                                            const isCall = (item: Call | Tip): item is Call =>
                                                'startTime' in item && !('timestamp' in item);

                                            const { date, time } = formatDate(
                                                isCall(item)
                                                    ? (item.startTime ?? '').toString()
                                                    : (item.timestamp ?? '').toString()
                                            );

                                            return (
                                                <tr
                                                    key={item._id}
                                                    className="text-sm hover:bg-white/5 transition-colors duration-200"
                                                >
                                                    {isCall(item) ? (
                                                        <>
                                                            <td className="p-4">
                                                                <div>{date}</div>
                                                                <div className="text-white/60">
                                                                    {time}
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                <div>
                                                                    {item.custom?.title as string}
                                                                </div>
                                                                <div className="text-white/60 flex items-center gap-1">
                                                                    <LinkIcon className="h-3 w-3" />
                                                                    {item.callId}
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                <span className="px-2 py-1 rounded-full bg-white/10">
                                                                    {(item.custom
                                                                        ?.type as string) || '-'}
                                                                </span>
                                                            </td>
                                                            <td className="p-4">
                                                                {formatDuration(item.duration ?? 0)}
                                                            </td>
                                                            <td className="p-4">
                                                                {item.poa ? (
                                                                    <POADialog poa={item.poa} />
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
                                                                <div className="text-white/60 flex items-center gap-1">
                                                                    <LinkIcon className="h-3 w-3" />
                                                                    {item.callId}{' '}
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                {item.fromUserId.username}
                                                            </td>
                                                            <td className="p-4">
                                                                {item.toUserId.username}
                                                            </td>
                                                            <td className="p-4">
                                                                {item.amount} {item.currency}
                                                            </td>
                                                            <td className="p-4">
                                                                <span
                                                                    className={`px-2 py-1 rounded-full ${
                                                                        item.status === 'completed'
                                                                            ? 'bg-green-500/20 text-green-400'
                                                                            : item.status ===
                                                                                'pending'
                                                                              ? 'bg-yellow-500/20 text-yellow-400'
                                                                              : 'bg-red-500/20 text-red-400'
                                                                    }`}
                                                                >
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                            <td className="p-4">
                                                                {item.transactionHash && (
                                                                    <Button
                                                                        variant="link"
                                                                        className="text-white underline hover:text-white/90 p-0 h-auto"
                                                                        onClick={() =>
                                                                            window.open(
                                                                                `https://etherscan.io/tx/${item.transactionHash}`,
                                                                                '_blank'
                                                                            )
                                                                        }
                                                                    >
                                                                        View transaction
                                                                    </Button>
                                                                )}
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
                        <div className="md:hidden max-h-[460px] overflow-y-auto">
                            <div className="p-4 space-y-4">
                                {(activeTab === 'history' ? sessions : tips).map(item => (
                                    <SessionCard
                                        key={item._id}
                                        session={
                                            activeTab === 'history'
                                                ? { ...(item as Call), userId: user?.id }
                                                : { ...(item as Tip), userId: user?.id }
                                        }
                                        type={activeTab}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
