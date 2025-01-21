"use client";

import React, { useState, useMemo, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { Settings, LogOut, Clock, Edit2, Check, X, Edit3, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePrivy } from "@privy-io/react-auth";
import dynamic from "next/dynamic";
import { UserDetailsProps, UserState } from "./userDetailsProps";
import { useAppDispatch } from "@/store/hooks";
import { updateUser } from "@/store/slices/userSlice";
import Logo from "@/public/images/icons/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

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
        <div className="w-full flex items-center justify-between p-4 text-white mb-24">
            {/* User profile */}
            {(isEditing) ? (
                <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={userInfo.initials} alt={userInfo.initials} />
                        <AvatarFallback>{userInfo.initials}</AvatarFallback>
                    </Avatar>
                    <div className="h-1 w-1 rounded-full bg-green-500" />
                    <Input
                        value={editedUsername}
                        onChange={(e) => setEditedUsername(e.target.value)}
                        className="h-8 w-40 bg-zinc-800 border-none text-white"
                        autoFocus
                    />
                    <Button onClick={handleSaveUsername} variant="ghost" size="icon" className="h-8 w-8 hover:bg-zinc-800">
                        <Check className="h-4 w-4 text-green-500" />
                    </Button>
                    <Button onClick={handleCancelEdit} variant="ghost" size="icon" className="h-8 w-8 hover:bg-zinc-800">
                        <X className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            ) : (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="group flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 transition-colors hover:bg-zinc-800">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={userInfo.initials} alt={userInfo.initials} />
                                <AvatarFallback>{userInfo.initials}</AvatarFallback>
                            </Avatar>
                            <div className="h-1 w-1 rounded-full bg-green-500" />
                            <span className="text-sm text-zinc-100">{editedUsername}</span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[144px] bg-zinc-900 p-2 border-none">
                        <DropdownMenuItem
                            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-zinc-100"
                            onSelect={(e) => {
                                e.preventDefault()
                                handleEditClick()
                            }}
                        >
                            <Edit3 className="h-4 w-4" />
                            <span>Edit name</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2">
                            <span className="bg-gradient-to-br from-[#552FC9] to-[#D7B35D] bg-clip-text text-transparent">
                                Buy basename
                            </span>
                            <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
            <div className="w-[180px] h-[43px]">
                <Logo />
            </div>
            {/* Settings dropdown */}
            <DropdownMenu open={state.isOpen} dir="ltr" onOpenChange={(open) => setState((prev) => ({ ...prev, isOpen: open }))}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-[#A3A3A3] hover:text-white hover:bg-transparent focus:bg-transparent">
                        <Settings className="h-5 w-5 mr-2" /> Settings
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    className="w-56 bg-[#1E1E1E] border-[#2E2E2E] text-white rounded-[10px] shadow-lg"
                    align="end"
                    side="bottom"
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