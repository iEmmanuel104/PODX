"use client";

import React, { useState, useMemo, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { Settings, LogOut, Clock, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePrivy } from "@privy-io/react-auth";
import dynamic from "next/dynamic";
import { UserDetailsProps, UserState } from "./userDetailsProps";
import { useAppDispatch } from "@/store/hooks";
import { updateUser } from "@/store/slices/userSlice";
import Logo from "@/assets/icons/Logo";

// Dynamic import for wallet operations
const WalletOperations = dynamic(() => import("./walletOperations"), {
    ssr: false,
    loading: () => null,
});

// Utility function
const formatAddress = (addr: string): string => (addr.length < 10 ? addr : `${addr.slice(0, 6)}...${addr.slice(-4)}`);

const UserDetails = memo<UserDetailsProps>(({ user }) => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { logout } = usePrivy();
    const [isEditing, setIsEditing] = useState(false);
    const [editedUsername, setEditedUsername] = useState(user?.username || "");
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

    const handleEditClick = useCallback(() => {
        setIsEditing(true);
        setEditedUsername(user?.username || "");
    }, [user?.username]);

    const handleSaveUsername = useCallback(() => {
        if (editedUsername.trim() && editedUsername !== user?.username) {
            dispatch(updateUser({ username: editedUsername.trim() }));
        }
        setIsEditing(false);
    }, [editedUsername, user?.username, dispatch]);

    const handleCancelEdit = useCallback(() => {
        setIsEditing(false);
        setEditedUsername(user?.username || "");
    }, [user?.username]);

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
        <div className="w-full flex items-center justify-between p-4 text-white">
            {/* User profile */}
            <div className="group flex justify-between items-center gap-[4px] bg-[#1d1d1d] rounded-full px-[10px] py-[4px] border border-[#232323]">
                <div className="w-6 h-6 bg-[#6032F6] rounded-full flex items-center justify-center text-sm font-bold">
                    {userInfo.initials}
                </div>
                <span className="h-[4px] w-[4px] rounded-full bg-[#69CB58]"></span>
                {isEditing ? (
                    <div className="flex items-center space-x-2">
                        <Input
                            value={editedUsername}
                            onChange={(e) => setEditedUsername(e.target.value)}
                            className="h-8 w-40 bg-[#444444] border-none text-white font-medium"
                            autoFocus
                        />
                        <button
                            onClick={handleSaveUsername}
                            className="p-1 hover:bg-[#444444] rounded-full"
                        >
                            <Check className="h-4 w-4 text-green-500" />
                        </button>
                        <button
                            onClick={handleCancelEdit}
                            className="p-1 hover:bg-[#444444] rounded-full"
                        >
                            <X className="h-4 w-4 text-red-500" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center space-x-2">
                        <span className="font-medium">{userInfo.displayName}</span>
                        
                        <button
                            onClick={handleEditClick}
                            className="p-1 hover:bg-[#444444] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Edit2 className="h-4 w-4 text-[#A3A3A3]" />
                        </button>
                    </div>
                )}
            </div>
           <div className="w-[180px] h-[44px]">
           <Logo />
           </div>
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