'use client';

import React, { memo, useMemo } from 'react';
import { Menu, Copy, User, ArrowUp, LogOut, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/store/api/userApi';

interface HeaderProps {
    userInfo: UserInfo | null;
    customData: Record<string, any>;
    live: boolean;
    userAddress: `0x${string}`;
    displayBalance: string;
    balanceSymbol: string | undefined;
    withdrawFunds?: boolean;
    toggleSidebar: () => void;
    handleLogout: () => void;
    copyAddress: () => void;
}

// Utility function
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
        <div className="hidden sm:block">
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

// User Avatar component
const UserAvatar = memo<{ username: string | undefined }>(({ username }) => (
    <div className="bg-[#6032F6] rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold">
        {username?.[0]} {username?.[1]}
    </div>
));

// Network Status component
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

// Wallet Info component
const WalletInfo = memo<{
    address: string;
    balance: string;
    symbol?: string;
    onCopy: () => void;
}>(({ address, balance, symbol, onCopy }) => (
    <div className="space-y-1 sm:space-y-2 w-full">
        <div className="flex items-center justify-between gap-1 sm:gap-2 mb-4">
            <span className="text-white text-xs sm:text-sm font-semibold">
                {truncateAddress(address)}
            </span>
            <p className="text-white text-[10px] sm:text-xs bg-violet-500 rounded-full px-1 sm:px-2 py-0.5">
                {balance} {symbol}
            </p>
        </div>
        <NetworkStatus address={address} onCopy={onCopy} />
    </div>
));

// Dropdown Content component
const UserDropdownContent = memo<{
    userAddress: string;
    displayBalance: string;
    balanceSymbol?: string;
    isEmbeddedWallet: boolean;
    onCopy: () => void;
    onWithdraw: () => void;
}>(({ userAddress, displayBalance, balanceSymbol, isEmbeddedWallet, onCopy, onWithdraw }) => (
    <DropdownMenuContent
        align="end"
        className="w-[280px] sm:w-[300px] bg-[#2d2d2d] rounded-[10px] shadow-lg py-4 sm:py-4 px-4 sm:px-5 border-none"
    >
        <div className="flex items-center justify-between mb-4 gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-300 flex items-center justify-center">
                <User className="w-6 h-6 text-gray-600" />
            </div>
            <WalletInfo
                address={userAddress}
                balance={displayBalance}
                symbol={balanceSymbol}
                onCopy={onCopy}
            />
        </div>
        <DropdownMenuItem asChild>
            <Button
                disabled={!isEmbeddedWallet}
                onClick={onWithdraw}
                className="flex items-center bg-[#6032F6] hover:bg-[#4006fc] hover:cursor-pointer rounded-full px-5 py-2 w-full"
            >
                <ArrowUp className="h-8 w-8 mr-2" />
                Withdraw funds
            </Button>
        </DropdownMenuItem>
    </DropdownMenuContent>
));

// Main Header component
const Header = memo<HeaderProps>(
    ({
        userInfo,
        customData,
        live,
        userAddress,
        displayBalance,
        balanceSymbol,
        withdrawFunds: isEmbeddedWallet,
        toggleSidebar,
        handleLogout,
        copyAddress,
    }) => {
        const withdrawFunds = () => {
            console.log('withdrawing funds');
        };

        return (
            <header className="flex flex-wrap justify-between items-center px-2 sm:px-4 py-2 bg-[#1d1d1d] rounded-full w-full mx-auto my-2 sm:my-5">
                <HeaderLeft title={customData.title} live={live} />

                <div className="flex items-center space-x-1 sm:space-x-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="flex items-center space-x-1 sm:space-x-2 bg-[#333333] rounded-full px-2 py-1 hover:cursor-pointer">
                                <UserAvatar username={userInfo?.username} />
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </DropdownMenuTrigger>
                        <UserDropdownContent
                            userAddress={userAddress}
                            displayBalance={displayBalance}
                            balanceSymbol={balanceSymbol}
                            isEmbeddedWallet={!!isEmbeddedWallet}
                            onCopy={copyAddress}
                            onWithdraw={withdrawFunds}
                        />
                    </DropdownMenu>

                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="text-red-500 hover:text-red-400 hover:bg-transparent hidden sm:flex"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span className="text-sm">Logout</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="block sm:hidden text-[#A3A3A3] hover:text-white p-1"
                        onClick={toggleSidebar}
                    >
                        <Menu className="w-5 h-5" />
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
