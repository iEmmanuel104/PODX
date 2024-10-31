"use client";
import React, { useState, useMemo, useCallback, memo, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Settings, LogOut, RefreshCcw, Download, Clock, Wallet, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePrivy } from "@privy-io/react-auth";
import { useBalance } from "wagmi";
import { useWalletOperations } from "@/hooks/useWalletOps";
import toast from "react-hot-toast";

// Types
interface User {
    username?: string;
    walletAddress: string;
    walletType?: string;
}

interface UserDetailsProps {
    user: User;
    activeWalletAddress: string;
}

interface UserState {
    isOpen: boolean;
    isSettingsOpen: boolean;
    isWarningOpen: boolean;
    isWithdrawOpen: boolean;
    amount: string;
    address: string;
}

// Memoized Components
const WalletInfo = memo<{ user: User; balance: string }>(({ user, balance }) => (
    <div className="px-3 py-2 border-b border-[#2E2E2E]">
        <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-[#DDB958] flex items-center justify-center">
                <Wallet className="h-4 w-4 text-white" />
            </div>
            <div>
                <p className="text-xs text-[#A3A3A3] truncate w-36">{formatAddress(user.walletAddress)}</p>
                <div className="flex items-center">
                    <p className="text-sm font-medium mr-1">Balance</p>
                    <div className="bg-[#6032F6] rounded-full px-2 py-0.5 text-xs">{balance} ETH</div>
                </div>
            </div>
        </div>
    </div>
));
WalletInfo.displayName = "WalletInfo";

const UserProfileButton = memo<{ displayName: string; initials: string }>(({ displayName, initials }) => (
    <div className="flex items-center space-x-3 bg-[#333333] rounded-full px-2 py-1">
        <div className="w-[24px] h-[24px] bg-[#6032F6] rounded-full flex items-center justify-center text-sm font-bold">{initials}</div>
        <span className="text-sm sm:text-base">{displayName}</span>
    </div>
));
UserProfileButton.displayName = "UserProfileButton";

// Utility functions
const formatAddress = (addr: string): string => (addr.length < 10 ? addr : `${addr.slice(0, 6)}...${addr.slice(-4)}`);

const initialState: UserState = {
    isOpen: false,
    isSettingsOpen: false,
    isWarningOpen: false,
    isWithdrawOpen: false,
    amount: "",
    address: "",
};

// Main component
const UserDetails = memo<UserDetailsProps>(({ user, activeWalletAddress }) => {
    const router = useRouter();
    const { logout } = usePrivy();
    const [state, setState] = useState<UserState>(initialState);
    const { handleWithdraw, handleExportWallet } = useWalletOperations();
    const canExportWallet = user?.walletType === "privy";

    // Memoized calculations
    const { data: balance } = useBalance({
        address: activeWalletAddress as `0x${string}`,
    });

    const displayBalance = useMemo(() => {
        const formattedBalance = balance ? Number(balance.value) / 1e18 : 0;
        return formattedBalance.toFixed(4);
    }, [balance]);

    const userInfo = useMemo(
        () => ({
            displayName: user?.username || formatAddress(user?.walletAddress),
            initials: user?.username ? user.username.slice(0, 2).toUpperCase() : user?.walletAddress.slice(0, 2).toUpperCase(),
        }),
        [user]
    );

    // Callbacks for actions
    const handleWithdrawClick = useCallback(() => {
        setState((prev) => ({
            ...prev,
            isSettingsOpen: false,
            isWarningOpen: true,
        }));
    }, []);

    const handleWarningConfirm = useCallback(() => {
        setState((prev) => ({
            ...prev,
            isWarningOpen: false,
            isWithdrawOpen: true,
        }));
    }, []);

    const handleWithdrawSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setState((prev) => ({ ...prev, isWithdrawOpen: false }));
            const notification = toast.loading("Withdrawing...");

            try {
                await handleWithdraw(
                    state.address,
                    state.amount,
                    (hash) => {
                        toast.success(`Withdrawal successful! Transaction hash: ${hash}`, { id: notification });
                        setState((prev) => ({ ...prev, amount: "", address: "" }));
                    },
                    (error) => toast.error(`Withdrawal failed: ${error.message}`, { id: notification })
                );
            } catch (error) {
                console.error("Withdrawal error:", error);
                toast.error(error instanceof Error ? error.message : "Withdrawal failed", { id: notification });
            }
        },
        [handleWithdraw, state.address, state.amount]
    );

    const handleExport = useCallback(async () => {
        try {
            await handleExportWallet(
                () => toast.success("Wallet exported successfully"),
                (error) => toast.error(`Export failed: ${error.message}`)
            );
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Export failed");
        }
    }, [handleExportWallet]);

    const handleLogout = useCallback(() => {
        logout();
        router.push("/");
    }, [logout, router]);

    // Render optimized dialog content only when needed
    const renderWithdrawDialog = () => {
        if (!state.isWithdrawOpen) return null;

        return (
            <Dialog open={state.isWithdrawOpen} onOpenChange={(open) => setState((prev) => ({ ...prev, isWithdrawOpen: open }))}>
                <DialogContent className="bg-[#1D1D1D] sm:rounded-3xl text-white p-6">
                    <DialogHeader className="px-4 py-4">
                        <DialogTitle>Withdraw</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleWithdrawSubmit} className="space-y-8 px-4 pb-6">
                        <div className="space-y-2">
                            <Label htmlFor="network">Network</Label>
                            <Select disabled defaultValue="base">
                                <SelectTrigger className="w-full bg-[#3c3c3c] border-0 text-white rounded-[10px]">
                                    <SelectValue placeholder="Select network" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#3c3c3c] border-[#2E2E2E] text-white">
                                    <SelectItem value="base">
                                        <Image
                                            src="/images/base.png"
                                            alt="Base"
                                            width={16}
                                            height={16}
                                            className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline-flex"
                                        />
                                        Base
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input
                                type="text"
                                id="amount"
                                value={state.amount}
                                onChange={(e) => setState((prev) => ({ ...prev, amount: e.target.value }))}
                                placeholder="Enter withdrawal amount"
                                className="bg-[#3c3c3c] text-white rounded-[10px] placeholder-gray-500"
                            />
                            <p className="text-sm text-gray-400">Balance: {displayBalance} ETH</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Wallet address</Label>
                            <Input
                                id="address"
                                value={state.address}
                                onChange={(e) => setState((prev) => ({ ...prev, address: e.target.value }))}
                                placeholder="Enter wallet address or basename"
                                className="bg-[#3c3c3c] text-white rounded-[10px] placeholder-gray-500"
                            />
                        </div>

                        <Button type="submit" className="w-full bg-[#6032f6] text-white hover:bg-[#4C28C4]">
                            Withdraw
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        );
    };

    return (
        <div className="w-full max-w-2xl flex items-center justify-between p-4 text-white">
            {/* User profile */}
            <UserProfileButton displayName={userInfo.displayName} initials={userInfo.initials} />

            {/* Settings dropdown */}
            <DropdownMenu open={state.isOpen} onOpenChange={(open) => setState((prev) => ({ ...prev, isOpen: open }))}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-[#A3A3A3] hover:text-white hover:bg-transparent focus:bg-transparent">
                        <Settings className="h-5 w-5 mr-2" /> Settings
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    className="w-56 bg-[#1E1E1E] border-[#2E2E2E] text-white rounded-[10px] shadow-lg"
                    align="end"
                    side="top"
                    sideOffset={5}
                >
                    <WalletInfo user={user} balance={displayBalance} />
                    <DropdownMenuItem
                        onSelect={handleWithdrawClick}
                        className="flex items-center px-3 py-2 cursor-pointer"
                        disabled={!canExportWallet}
                    >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        <span>Withdraw funds</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center px-3 py-2 cursor-pointer" onSelect={handleExport} disabled={!canExportWallet}>
                        <Download className="mr-2 h-4 w-4" />
                        <span>Export wallet</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center px-3 py-2 cursor-pointer">
                        <Clock className="mr-2 h-4 w-4" />
                        <span>Session history</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center px-3 py-2 cursor-pointer text-red-500" onSelect={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Dialogs */}
            {state.isWarningOpen && (
                <Dialog open={state.isWarningOpen} onOpenChange={(open) => setState((prev) => ({ ...prev, isWarningOpen: open }))}>
                    <DialogContent className="bg-[#1d1d1d] border-0 text-white max-w-[320px] sm:rounded-3xl rounded-2xl">
                        <div className="flex flex-col items-center text-center space-y-4 py-4">
                            <div className="relative">
                                <AlertTriangle className="h-12 w-12 text-yellow-500" />
                                <div className="absolute top-0 right-0 h-3 w-3 bg-blue-500 rounded-full" />
                            </div>
                            <p className="text-lg font-semibold">
                                This wallet only supports Base chain for now, your withdrawal would be in the Base Network
                            </p>
                        </div>
                        <DialogFooter className="sm:justify-center">
                            <Button className="w-full bg-[#6032f6] hover:bg-[#4C28C4] text-white rounded-xl py-6" onClick={handleWarningConfirm}>
                                I understand.
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {renderWithdrawDialog()}
        </div>
    );
});

UserDetails.displayName = "UserDetails";
export default UserDetails;
