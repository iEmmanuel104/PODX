"use client";
import React, { useState, useCallback, useContext, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Settings, Edit2, Menu, LogOut, RefreshCcw, Download, Clock, Wallet, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CreateSessionModal from "@/components/pod/createSessionModal";
import CreatedSessionModal from "@/components/pod/createdSessionModal";
import UserInfoModal from "@/components/user/userInfoModal";
import Logo from "@/components/ui/logo";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { customAlphabet } from "nanoid";
import { AppContext } from "@/providers/appProvider";
import { ErrorFromResponse, GetCallResponse, StreamVideoClient, User } from "@stream-io/video-react-sdk";
import { API_KEY, CALL_TYPE } from "@/providers/meetProvider";
import { setSessionInfo } from "@/store/slices/podSlice";
import { updateUser } from "@/store/slices/userSlice";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const GUEST_USER: User = { id: "guest", type: "guest" };

const getMeetingId = (): string => {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const nanoid = customAlphabet(alphabet, 4);

    return `${nanoid(3)}-${nanoid(4)}-${nanoid(3)}`;
};

const formatAddress = (addr: string) => {
    if (addr.length < 10) return addr
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function PodPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { setNewMeeting } = useContext(AppContext);
    const [meetingCode, setMeetingCode] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreatedModalOpen, setIsCreatedModalOpen] = useState(false);
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [error, setError] = useState("");
    const [inviteLink, setInviteLink] = useState("");
    const [sessionCode, setSessionCode] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [isJoiningCreated, setIsJoiningCreated] = useState(false);

    const { isLoggedIn, user } = useAppSelector((state) => state.user);

    const [isOpen, setIsOpen] = useState(false)
    const [isOpenDialogue, setIsOpenDialogue] = useState(false)

    useEffect(() => {
        if (isLoggedIn && user && user.username.startsWith("guest-")) {
            setShowUsernameModal(true);
        }
    }, [isLoggedIn, user]);

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (error) {
            timeout = setTimeout(() => {
                setError("");
            }, 3000);
        }
        return () => {
            clearTimeout(timeout);
        };
    }, [error]);

    const openCreateModal = () => setIsCreateModalOpen(true);
    const closeCreateModal = () => setIsCreateModalOpen(false);
    const openCreatedModal = () => setIsCreatedModalOpen(true);
    const closeCreatedModal = () => setIsCreatedModalOpen(false);

    const handleCreateSession = useCallback(
        async (title: string, type: "Audio Session" | "Video Session") => {
            setNewMeeting(true);
            const newSessionCode = getMeetingId();
            setInviteLink(`https://www.podx.fun/pod/${newSessionCode}`);
            setSessionCode(newSessionCode);
            dispatch(setSessionInfo({ title, type, sessionId: newSessionCode }));
            closeCreateModal();
            openCreatedModal();
        },
        [dispatch, setNewMeeting]
    );

    const handleJoinSession = useCallback(async () => {
        if (!meetingCode) return;
        setIsJoining(true);
        console.log("Joining session with code: ", meetingCode);

        try {
            const client = new StreamVideoClient({
                apiKey: API_KEY,
                user: GUEST_USER,
            });

            const call = client.call(CALL_TYPE, meetingCode);

            const response: GetCallResponse = await call.get();
            if (response.call && meetingCode === response.call.custom.sessionId) {
                dispatch(
                    setSessionInfo({
                        title: response.call.custom.title,
                        type: response.call.custom.type,
                        sessionId: meetingCode,
                    })
                );
                router.push(`/pod/join/${meetingCode}`);
                return;
            }
        } catch (e: unknown) {
            let err = e as ErrorFromResponse<GetCallResponse>;
            console.error(err.message);
            if (err.status === 404) {
                setError("Couldn't find the meeting you're trying to join.");
            }
        } finally {
            setIsJoining(false);
        }
    }, [meetingCode, router, dispatch]);

    const handleJoinCreatedSession = useCallback(async () => {
        setIsJoiningCreated(true);
        try {
            router.push(`/pod/join/${sessionCode}`);
        } catch (error) {
            console.error("Failed to join created session:", error);
        } finally {
            setIsJoiningCreated(false);
        }
    }, [router, sessionCode]);

    const handleUpdateUsername = useCallback(
        (newUsername: string) => {
            setShowUsernameModal(false);
            dispatch(updateUser({ username: newUsername }));
        },
        [dispatch]
    );

    const openUsernameModal = () => setShowUsernameModal(true);

    if (!isLoggedIn || !user) {
        router.push("/");
        return null;
    }

    const displayName = user.username || `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`;
    const initials = user.username ? user.username.slice(0, 2).toUpperCase() : user.walletAddress.slice(0, 2).toUpperCase();

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative">
            <div className="w-full max-w-2xl flex flex-col items-center">
                <div className="mb-12">
                    <Logo />
                </div>

                <Dialog open={isOpenDialogue} onOpenChange={setIsOpenDialogue}>
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            className="mb-8 bg-[#1E1E1E] hover:bg-[#2E2E2E] text-[#A3A3A3] hover:text-white rounded-full px-4 py-2 text-sm font-medium flex items-center space-x-2 border border-[#2E2E2E]"
                        >
                            <Flame className="w-4 h-4 text-[#FF6B00]" />
                            <span>You have no session streak</span>
                            <span className="ml-1">→</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-[#1E1E1E] text-white border border-[#2E2E2E] p-0 rounded-xl">
                        <div className="p-6 flex flex-col items-center">
                            <Flame className="w-12 h-12 text-[#FF6B00] mb-4" />
                            <DialogHeader className="">
                                <DialogTitle className="text-4xl text-center font-bold mb-1">0 day</DialogTitle>
                                <DialogDescription className="text-[#A3A3A3] text-lg mb-4">
                                    Session Streak
                                </DialogDescription>
                            </DialogHeader>
                            <DialogDescription className="text-center text-[#A3A3A3] mb-6">
                                Session streaks are consecutive daily sessions that are either created or attended.
                            </DialogDescription>
                            <Button
                                className="w-full bg-[#6032F6] hover:bg-[#4C28C4] text-white rounded-xl py-2 px-4"
                                onClick={() => setIsOpenDialogue(false)}
                            >
                                I understand.
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <div className="w-full flex flex-col md:flex-row gap-6 mb-8 sm:mb-16">
                    <div className="flex-1 rounded-2xl p-6 bg-[#1E1E1E] flex flex-col justify-between" style={{ minHeight: "200px" }}>
                        <div>
                            <h2 className="text-2xl font-semibold mb-2 text-white">Join Session</h2>
                            <p className="text-[#A3A3A3] text-sm">Join a meeting instantly and collaborate!</p>
                        </div>
                        <div className="flex flex-col gap-4 mt-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Input
                                    type="text"
                                    placeholder="Enter meeting code"
                                    value={meetingCode}
                                    onChange={(e) => setMeetingCode(e.target.value)}
                                    className="flex-1 bg-[#2C2C2C] rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6032F6] text-white placeholder-[#6C6C6C]"
                                />
                                <Button
                                    onClick={handleJoinSession}
                                    disabled={!meetingCode || isJoining}
                                    className="bg-[#6032F6] text-white px-8 py-2 rounded-md hover:bg-[#4C28C4] transition-all duration-300 ease-in-out text-sm font-medium disabled:bg-gray-500 disabled:cursor-not-allowed"
                                >
                                    {isJoining ? "Joining..." : "Join"}
                                </Button>
                            </div>
                            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
                        </div>
                    </div>

                    <div
                        className="w-full md:w-[42%] rounded-lg p-6 bg-gradient-to-br from-[#6032F6] to-[#381D90] flex flex-col justify-between"
                        style={{ minHeight: "200px" }}
                    >
                        <div>
                            <Image src="/images/play-add.svg" alt="Create Session" width={32} height={32} className="mb-4" />
                            <h2 className="text-2xl font-semibold mb-2 text-white">Create Session</h2>
                        </div>
                        <p className="text-[#E9D5FF] text-sm mb-4">
                            Start a meeting or podcast session in seconds - collaborate, share, and record with ease!
                        </p>
                        <Button
                            onClick={openCreateModal}
                            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-4 rounded-full transition-colors duration-300"
                        >
                            Create Session
                        </Button>
                    </div>
                </div>
            </div>
            <div className="w-full max-w-2xl flex items-center justify-between p-4 text-white">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#6032F6] rounded-full flex items-center justify-center text-sm font-bold">
                        {initials}
                    </div>
                    <span className="text-sm sm:text-base">{displayName}</span>
                </div>
                <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="text-[#A3A3A3] hover:text-white hover:bg-transparent focus:bg-transparent active:bg-transparent">
                            <Settings className="h-5 w-5 mr-2" /> Settings
                            <span className="sr-only">Settings</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-56 bg-[#1E1E1E] border-[#2E2E2E] text-white rounded-md shadow-lg"
                        align="end"
                        side="top"
                        sideOffset={5}
                    >
                        <div className="px-3 py-2 border-b border-[#2E2E2E]">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                                    <Wallet className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs text-[#A3A3A3] truncate w-36">{formatAddress(user.walletAddress)}</p>
                                    <div className="flex items-center">
                                        <p className="text-sm font-medium mr-1">Balance</p>
                                        <div className="bg-[#6032F6] rounded-full px-2 py-0.5 text-xs">
                                            0.1ETH
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DropdownMenuItem className="flex items-center px-3 py-2 hover:bg-[#2E2E2E] cursor-pointer">
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            <span>Withdraw funds</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center px-3 py-2 hover:bg-[#2E2E2E] cursor-pointer">
                            <Download className="mr-2 h-4 w-4" />
                            <span>Export wallet</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center px-3 py-2 hover:bg-[#2E2E2E] cursor-pointer">
                            <Clock className="mr-2 h-4 w-4" />
                            <span>Session history</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center px-3 py-2 hover:bg-[#2E2E2E] cursor-pointer text-red-500">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <CreateSessionModal isOpen={isCreateModalOpen} onClose={closeCreateModal} onCreateSession={handleCreateSession} />
            <CreatedSessionModal
                isOpen={isCreatedModalOpen}
                onClose={closeCreatedModal}
                inviteLink={inviteLink}
                sessionCode={sessionCode}
                isJoining={isJoiningCreated}
                onJoinSession={handleJoinCreatedSession}
            />
            {user && (
                <UserInfoModal
                    isOpen={showUsernameModal}
                    onClose={() => setShowUsernameModal(false)}
                    initialUsername={user.username}
                    onUpdate={handleUpdateUsername}
                />
            )}
        </div>
    );
}
