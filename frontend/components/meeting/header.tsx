'use client';

import React, { memo, useEffect, useState } from 'react';
import { Menu, Copy, User, ArrowUp, LogOut, ChevronDown, Users } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/store/user/types';
import { fetchData } from './header2';

interface HeaderProps {
    userInfo: UserInfo | null;
    customData: Record<string, any>;
    live: boolean;
    userAddress: `0x${string}`;
    displayBalance: string;
    balanceSymbol: string | undefined;
    withdrawFunds?: boolean;
    toggleParticipants: () => void;
    copyAddress: () => void;
}

interface BasenameData {
    basename: string | null;
    avatar: string | null;
}

// Utility functions
const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-5)}`;
};

// Left section component
const HeaderLeft = memo<{
    title: string;
    live: boolean;
}>(({ title, live }) => (
    <div className="flex items-center space-x-2 flex-grow sm:flex-grow-0">
        <div className="relative w-[80px] h-[40px] sm:w-[120px] sm:h-[50px]">
            <Image
                src="/logo.png"
                layout="fill"
                objectFit="contain"
                alt="Podx"
                className="p-0.5 sm:p-1"
                priority
            />
        </div>
        <div className="hidden sm:flex items-center gap-4">
            {' '}
            <span className="text-gray-300">|</span>
            <p className="text-sm md:text-base truncate max-w-[150px] md:max-w-full">{title}</p>
        </div>
        <LiveIndicator isLive={live} />
    </div>
));

// Live indicator component
const LiveIndicator = memo<{ isLive: boolean }>(({ isLive }) => (
    <span className="bg-red-500 text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap">
        {isLive ? 'Live' : 'Offline'}
    </span>
));

// Updated User Avatar component
const UserAvatar = memo<{
    username: string | undefined;
    basenameData: BasenameData | null;
}>(({ username, basenameData }) => {
    if (basenameData?.avatar) {
        return (
            <div className="w-8 h-8 rounded-full overflow-hidden">
                <Image
                    src={basenameData.avatar}
                    alt={basenameData.basename || 'User avatar'}
                    width={32}
                    height={32}
                    className="object-cover"
                />
            </div>
        );
    }

    // Fallback to initials
    const displayText = basenameData?.basename?.[0] || username?.[0] || '?';
    return (
        <div className="bg-[#6032F6] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
            {displayText}
        </div>
    );
});

const NetworkStatus = memo<{
    address: string;
    onCopy: () => void;
}>(({ address, onCopy }) => (
    <div className="flex items-center justify-between bg-[#1d1d1d] pl-3 mb-0.5 sm:mb-1 rounded-full">
        <Image
            src="/images/base.png"
            alt="Base"
            width={16}
            height={16}
            className="w-4 h-4 sm:w-5 sm:h-5"
        />
        <div className="flex items-center">
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full mr-1 sm:mr-2" />
            <span className="text-[#A3A3A3] text-[10px] sm:text-xs">
                {truncateAddress(address)}
            </span>
        </div>
        <Button
            variant="ghost"
            size="icon"
            onClick={onCopy}
            className="text-[#A3A3A3] hover:text-white hover:bg-black"
        >
            <Copy className="w-2 h-2" />
        </Button>
    </div>
));

// Updated Wallet Info component
const WalletInfo = memo<{
    address: string;
    balance: string;
    symbol?: string;
    onCopy: () => void;
    basenameData: BasenameData | null;
}>(({ address, balance, symbol, onCopy, basenameData }) => (
    <div className="space-y-1 sm:space-y-2 w-full">
        <div className="flex items-center justify-between gap-1 sm:gap-2 mb-4">
            <span className="text-white text-xs sm:text-sm font-semibold">
                {basenameData?.basename || truncateAddress(address)}
            </span>
            <p className="text-white text-[10px] sm:text-xs bg-violet-500 rounded-full px-1 sm:px-2 py-0.5">
                {balance} {symbol}
            </p>
        </div>
        <NetworkStatus address={address} onCopy={onCopy} />
    </div>
));

// Updated Dropdown Content component
const UserDropdownContent = memo<{
    userAddress: string;
    displayBalance: string;
    balanceSymbol?: string;
    isEmbeddedWallet: boolean;
    onCopy: () => void;
    onWithdraw: () => void;
    basenameData: BasenameData | null;
}>(({ userAddress, displayBalance, balanceSymbol, onCopy, basenameData }) => (
    <DropdownMenuContent
        align="end"
        className="max-w-[280px] bg-[#2d2d2d] rounded-[15px] shadow-lg p-3 border-none"
    >
        <div className="flex items-center justify-between gap-2">
            {basenameData?.avatar ? (
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                    <Image
                        src={basenameData.avatar || '/placeholder.svg'}
                        alt={basenameData.basename || 'User avatar'}
                        width={40}
                        height={40}
                        className="object-cover"
                    />
                </div>
            ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-gray-600" />
                </div>
            )}
            <div className="flex flex-col space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">
                        {basenameData?.basename || truncateAddress(userAddress)}
                    </span>
                    <span className="rounded-full bg-[#7C3AED] px-1 text-[13px] font-medium text-white">
                        {displayBalance}
                        {balanceSymbol}
                    </span>
                </div>
                <div className="flex items-center justify-between w-full gap-1.5">
                    <Image
                        src="/images/base.png"
                        width={20}
                        height={20}
                        alt="Base"
                        className="h-5 w-5 object-contain"
                    />
                    <div className="flex items-center gap-1.5 flex-grow">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-sm text-zinc-400 flex-1">
                            {truncateAddress(userAddress)}
                        </span>
                    </div>
                    <button
                        onClick={onCopy}
                        className="ml-1 rounded-md p-1 hover:bg-white/10 transition-colors"
                        aria-label="Copy address"
                    >
                        <Copy className="h-3.5 w-3.5 text-zinc-400" />
                    </button>
                </div>
            </div>
        </div>
    </DropdownMenuContent>
));

// Updated Main Header component
const Header = memo<HeaderProps>(
    ({
        userInfo,
        customData,
        live,
        userAddress,
        displayBalance,
        balanceSymbol,
        withdrawFunds: isEmbeddedWallet,
        toggleParticipants,
        copyAddress,
    }) => {
        const [basenameData, setBasenameData] = useState<BasenameData | null>(null);

        useEffect(() => {
            const loadBasenameData = async () => {
                try {
                    const data = await fetchData(userAddress);
                    setBasenameData(data);
                } catch (error) {
                    console.error('Error loading basename data:', error);
                    setBasenameData(null);
                }
            };

            loadBasenameData();
        }, [userAddress]);

        const withdrawFunds = () => {
            console.log('withdrawing funds');
        };

        return (
            <header className="flex flex-wrap justify-between items-center h-12 px-2 sm:px-4 py-2 rounded-full w-full mx-auto my-2 sm:my-5">
                <HeaderLeft title={customData.title} live={live} />
                <div className="flex items-center space-x-1 sm:space-x-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="flex items-center gap-1 bg-[#333333] rounded-full h-8 pl-1 pr-2 hover:cursor-pointer hover:bg-[#3d3d3d] transition-colors">
                                <UserAvatar
                                    username={userInfo?.username}
                                    basenameData={basenameData}
                                />
                                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                            </div>
                        </DropdownMenuTrigger>
                        <UserDropdownContent
                            userAddress={userAddress}
                            displayBalance={displayBalance}
                            balanceSymbol={balanceSymbol}
                            isEmbeddedWallet={!!isEmbeddedWallet}
                            onCopy={copyAddress}
                            onWithdraw={withdrawFunds}
                            basenameData={basenameData}
                        />
                    </DropdownMenu>

                    <Button
                        variant="ghost"
                        size="default"
                        onClick={toggleParticipants}
                        className="text-[#A3A3A3] hover:text-white bg-[#2E2E2E] hover:bg-[#2E2E2E] px-3 py-1 rounded-full"
                    >
                        <Users className="w-5 h-5" />
                        Participants
                    </Button>
                </div>
            </header>
        );
    }
);

// Add display names
HeaderLeft.displayName = 'HeaderLeft';
LiveIndicator.displayName = 'LiveIndicator';
UserAvatar.displayName = 'UserAvatar';
NetworkStatus.displayName = 'NetworkStatus';
WalletInfo.displayName = 'WalletInfo';
UserDropdownContent.displayName = 'UserDropdownContent';
Header.displayName = 'Header';

export default Header;
