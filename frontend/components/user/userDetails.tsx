"use client";
import React, { useState, useMemo, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { Settings, LogOut, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePrivy } from "@privy-io/react-auth";
import dynamic from "next/dynamic";
import { UserDetailsProps, UserState } from "./userDetailsProps";

// Dynamic import for wallet operations
const WalletOperations = dynamic(() => import("./walletOperations"), {
    ssr: false,
    loading: () => null,
});

// Utility function
const formatAddress = (addr: string): string => (addr.length < 10 ? addr : `${addr.slice(0, 6)}...${addr.slice(-4)}`);

const UserDetails = memo<UserDetailsProps>(({ user }) => {
    const router = useRouter();
    const { logout } = usePrivy();
    const [state, setState] = useState<UserState>({
        isOpen: false,
        isSettingsOpen: false,
        isWarningOpen: false,
        isWithdrawOpen: false,
        amount: "",
        address: "",
    });

    // Memoized user info
    const userInfo = useMemo(
        () => ({
            displayName: user?.username || formatAddress(user?.walletAddress),
            initials: (user?.username || user?.walletAddress).slice(0, 2).toUpperCase(),
            isPrivyWallet: user?.walletClientType === "privy",
        }),
        [user]
    );

    const handleLogout = useCallback(() => {
        logout();
        router.push("/");
    }, [logout, router]);

    // Wallet operation handlers
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

    return (
        <div className="w-full max-w-2xl flex items-center justify-between p-4 text-white">
            {/* User profile */}
            <div className="flex items-center space-x-3 bg-[#333333] rounded-full px-2 py-1">
                <div className="w-[24px] h-[24px] bg-[#6032F6] rounded-full flex items-center justify-center text-sm font-bold">
                    {userInfo.initials}
                </div>
                <span className="text-sm sm:text-base">{userInfo.displayName}</span>
            </div>

            {/* Settings dropdown */}
            <DropdownMenu open={state.isOpen} onOpenChange={(open) => setState((prev) => ({ ...prev, isOpen: open }))}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-[#A3A3A3] hover:text-white hover:bg-transparent focus:bg-transparent">
                        <Settings className="h-5 w-5 mr-2" /> Settings
                    </Button>
                </DropdownMenuTrigger>

                {/* Dropdown content */}
                <DropdownMenuContent
                    className="w-56 bg-[#1E1E1E] border-[#2E2E2E] text-white rounded-[10px] shadow-lg"
                    align="end"
                    side="top"
                    sideOffset={5}
                >
                    {/* Wallet Operations Component */}
                    {userInfo.isPrivyWallet && (
                        <WalletOperations
                            state={state}
                            setState={setState}
                            user={user}
                            onWithdrawClick={handleWithdrawClick}
                            onWarningConfirm={handleWarningConfirm}
                        />
                    )}

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
        </div>
    );
});

UserDetails.displayName = "UserDetails";
export default UserDetails;
