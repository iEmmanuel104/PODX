"use client";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Settings, LogOut, RefreshCcw, Download, Clock, Wallet, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { customAlphabet } from "nanoid";
import { AppContext } from "@/providers/appProvider";
import { StreamVideoClient, ErrorFromResponse, GetCallResponse } from "@stream-io/video-react-sdk";
import { API_KEY, CALL_TYPE } from "@/providers/meetProvider";
import { setSessionInfo } from "@/store/slices/podSlice";
import { updateUser } from "@/store/slices/userSlice";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useWallets } from "@privy-io/react-auth";
import { useBalance } from "wagmi";

// Dynamically import modals for better code splitting
const CreateSessionModal = React.lazy(() => import("@/components/pod/createSessionModal"));
const CreatedSessionModal = React.lazy(() => import("@/components/pod/createdSessionModal"));
const UserInfoModal = React.lazy(() => import("@/components/user/userInfoModal"));
const Logo = React.lazy(() => import("@/components/ui/logo"));

// Memoized utility functions
const getMeetingId = () => {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const nanoid = customAlphabet(alphabet, 4);
    return `${nanoid(3)}-${nanoid(4)}-${nanoid(3)}`;
};

const formatAddress = (addr: string) => 
    addr.length < 10 ? addr : `${addr.slice(0, 6)}...${addr.slice(-4)}`;

// Create a separate error handler component
const ErrorMessage = ({ message, onClear }: { message: string; onClear: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClear, 3000);
        return () => clearTimeout(timer);
    }, [message, onClear]);

    return message ? <div className="text-red-500 text-sm mt-2">{message}</div> : null;
};

// Separate component for the wallet info section
const WalletInfo = ({ user, balance }: { user: any; balance: string }) => (
    <div className="px-3 py-2 border-b border-[#2E2E2E]">
        <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-[#DDB958] flex items-center justify-center">
                <Wallet className="h-4 w-4 text-white" />
            </div>
            <div>
                <p className="text-xs text-[#A3A3A3] truncate w-36">{formatAddress(user.walletAddress)}</p>
                <div className="flex items-center">
                    <p className="text-sm font-medium mr-1">Balance</p>
                    <div className="bg-[#6032F6] rounded-full px-2 py-0.5 text-xs">
                        {balance} ETH
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default function PodPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { setNewMeeting } = React.useContext(AppContext);
    const [state, setState] = useState({
        meetingCode: "",
        error: "",
        inviteLink: "",
        sessionCode: "",
        isJoining: false,
        isJoiningCreated: false,
        isCreateModalOpen: false,
        isCreatedModalOpen: false,
        showUsernameModal: false,
        isOpen: false,
        isOpenDialogue: false,
    });

    const { isLoggedIn, user } = useAppSelector((state) => state.user);
    const { wallets } = useWallets();
    const activeWalletAddress = wallets[0]?.address;

    // Memoize balance calculation
    const { data: balance } = useBalance({
        address: activeWalletAddress as `0x${string}`,
    });

    const displayBalance = useMemo(() => {
        const formattedBalance = balance ? Number(balance.value) / 1e18 : 0;
        return formattedBalance.toFixed(4);
    }, [balance]);

    // Memoize user display info
    const userInfo = useMemo(
        () => ({
            displayName: user?.username || `${user?.walletAddress.slice(0, 6)}...${user?.walletAddress.slice(-4)}`,
            initials: user?.username ? user.username.slice(0, 2).toUpperCase() : user?.walletAddress.slice(0, 2).toUpperCase(),
        }),
        [user]
    );

    useEffect(() => {
        if (isLoggedIn && user?.username?.startsWith("guest-")) {
            setState((prev) => ({ ...prev, showUsernameModal: true }));
        }
    }, [isLoggedIn, user]);

    // Optimized session creation
    const handleCreateSession = useCallback(
        async (title: string, type: "Audio Session" | "Video Session") => {
            setNewMeeting(true);
            const newSessionCode = getMeetingId();
            setState((prev) => ({
                ...prev,
                inviteLink: `https://www.podx.fun/pod/${newSessionCode}`,
                sessionCode: newSessionCode,
                isCreateModalOpen: false,
                isCreatedModalOpen: true,
            }));
            dispatch(setSessionInfo({ title, type, sessionId: newSessionCode }));
        },
        [dispatch, setNewMeeting]
    );

    // Optimized session joining
    const handleJoinSession = useCallback(async () => {
        if (!state.meetingCode) return;

        setState((prev) => ({ ...prev, isJoining: true, error: "" }));

        try {
            const client = new StreamVideoClient({
                apiKey: API_KEY,
                user: { id: "guest", type: "guest" },
            });

            const call = client.call(CALL_TYPE, state.meetingCode);
            const response: GetCallResponse = await call.get();

            if (response.call && state.meetingCode === response.call.custom.sessionId) {
                dispatch(
                    setSessionInfo({
                        title: response.call.custom.title,
                        type: response.call.custom.type,
                        sessionId: state.meetingCode,
                    })
                );
                router.push(`/pod/join/${state.meetingCode}`);
                return;
            }
        } catch (e: unknown) {
            const err = e as ErrorFromResponse<GetCallResponse>;
            setState((prev) => ({
                ...prev,
                error: err.status === 404 ? "Couldn't find the meeting you're trying to join." : "Failed to join meeting",
            }));
        } finally {
            setState((prev) => ({ ...prev, isJoining: false }));
        }
    }, [state.meetingCode, router, dispatch]);

    // Handle created session joining
    const handleJoinCreatedSession = useCallback(async () => {
        setState((prev) => ({ ...prev, isJoiningCreated: true }));
        try {
            router.push(`/pod/join/${state.sessionCode}`);
        } catch (error) {
            console.error("Failed to join created session:", error);
        } finally {
            setState((prev) => ({ ...prev, isJoiningCreated: false }));
        }
    }, [router, state.sessionCode]);

    // Username update handler
    const handleUpdateUsername = useCallback(
        (newUsername: string) => {
            setState((prev) => ({ ...prev, showUsernameModal: false }));
            dispatch(updateUser({ username: newUsername }));
        },
        [dispatch]
    );

    if (!isLoggedIn || !user) {
        router.push("/");
        return null;
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative">
            {/* Main content container */}
            <div className="w-full max-w-2xl flex flex-col items-center">
                <React.Suspense fallback={<div className="h-12" />}>
                    <Logo />
                </React.Suspense>

                {/* Session streak dialog */}
                <Dialog open={state.isOpenDialogue} onOpenChange={(open) => setState((prev) => ({ ...prev, isOpenDialogue: open }))}>
                    {/* ... (Dialog content remains the same) ... */}
                </Dialog>

                {/* Main grid container */}
                <div className="w-full flex flex-col md:flex-row gap-6 mb-8 sm:mb-16">
                    {/* Join Session Card */}
                    <div className="flex-1 rounded-[10px] p-6 bg-[#1E1E1E] flex flex-col justify-between" style={{ minHeight: "200px" }}>
                        <div>
                            <h2 className="text-[32px] font-semibold text-white">Join Session</h2>
                            <p className="text-[#A3A3A3] text-sm">Join a meeting instantly and collaborate!</p>
                        </div>
                        <div className="flex flex-col gap-4 mt-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Input
                                    type="text"
                                    placeholder="Enter meeting code"
                                    value={state.meetingCode}
                                    onChange={(e) => setState((prev) => ({ ...prev, meetingCode: e.target.value }))}
                                    className="flex-1 bg-[#2C2C2C] rounded-[10px] px-4 py-2 text-sm border-[#3c3c3c] focus-within:border-[#3c3c3c] focus:border-[#3c3c3c] focus:ring-[#3c3c3c] text-white placeholder-[#6C6C6C]"
                                />
                                <Button
                                    onClick={handleJoinSession}
                                    disabled={!state.meetingCode || state.isJoining}
                                    className="bg-[#6032F6] text-white px-8 py-2 rounded-[10px] hover:bg-[#4C28C4] transition-all duration-300 ease-in-out text-sm font-medium disabled:bg-gray-500 disabled:cursor-not-allowed"
                                >
                                    {state.isJoining ? "Joining..." : "Join"}
                                </Button>
                            </div>
                            <ErrorMessage message={state.error} onClear={() => setState((prev) => ({ ...prev, error: "" }))} />
                        </div>
                    </div>

                    {/* Create Session Card */}
                    <div
                        className="w-full md:w-[42%] rounded-[10px] p-6 bg-gradient-to-br from-[#6032F6] to-[#381D90] flex flex-col justify-between"
                        style={{ minHeight: "200px" }}
                    >
                        <div>
                            <Image src="/images/play-add.svg" alt="Create Session" width={32} height={32} className="mb-4" priority />
                            <h2 className="text-[32px] font-semibold text-white">Create Session</h2>
                            <p className="text-[#E9D5FF] text-sm mb-4">
                                Start a meeting or podcast session in seconds - collaborate, share, and record with ease!
                            </p>
                        </div>
                        <Button
                            onClick={() => setState((prev) => ({ ...prev, isCreateModalOpen: true }))}
                            className="w-full bg-[#DDB958] hover:bg-[#DDB958] text-black font-semibold py-2 px-4 rounded-[10px] transition-colors duration-300"
                        >
                            Create Session
                        </Button>
                    </div>
                </div>
            </div>

            {/* User profile and settings section */}
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
                        <Button
                            variant="ghost"
                            className="text-[#A3A3A3] hover:text-white hover:bg-transparent focus:bg-transparent active:bg-transparent"
                        >
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
                        {/* Dropdown menu items */}
                        <DropdownMenuItem className="flex items-center px-3 py-2 cursor-pointer">
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            <span>Withdraw funds</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center px-3 py-2 cursor-pointer">
                            <Download className="mr-2 h-4 w-4" />
                            <span>Export wallet</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center px-3 py-2 cursor-pointer">
                            <Clock className="mr-2 h-4 w-4" />
                            <span>Session history</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center px-3 py-2 cursor-pointer text-red-500">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Modals */}
            <React.Suspense fallback={null}>
                {state.isCreateModalOpen && (
                    <CreateSessionModal
                        isOpen={state.isCreateModalOpen}
                        onClose={() => setState((prev) => ({ ...prev, isCreateModalOpen: false }))}
                        onCreateSession={handleCreateSession}
                    />
                )}

                {state.isCreatedModalOpen && (
                    <CreatedSessionModal
                        isOpen={state.isCreatedModalOpen}
                        onClose={() => setState((prev) => ({ ...prev, isCreatedModalOpen: false }))}
                        inviteLink={state.inviteLink}
                        sessionCode={state.sessionCode}
                        isJoining={state.isJoiningCreated}
                        onJoinSession={handleJoinCreatedSession}
                    />
                )}

                {user && state.showUsernameModal && (
                    <UserInfoModal
                        isOpen={state.showUsernameModal}
                        onClose={() => setState((prev) => ({ ...prev, showUsernameModal: false }))}
                        initialUsername={user.username}
                        onUpdate={handleUpdateUsername}
                    />
                )}
            </React.Suspense>
        </div>
    );
}