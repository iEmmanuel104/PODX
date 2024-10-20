"use client";
import React, { useState, useCallback, useContext, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Settings, Edit2, Menu } from "lucide-react";
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

const GUEST_USER: User = { id: "guest", type: "guest" };

const getMeetingId = (): string => {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const nanoid = customAlphabet(alphabet, 4);

    return `${nanoid(3)}-${nanoid(4)}-${nanoid(3)}`;
};

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
    const [showEditIcon, setShowEditIcon] = useState(false);

    const { isLoggedIn, user } = useAppSelector((state) => state.user);

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
            setInviteLink(`https://podx-pi.vercel.app/pod/${newSessionCode}`);
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
                <div className="mb-16">
                    <Logo />
                </div>

                <div
                    className="flex items-center mb-8 sm:mb-16 relative"
                    onMouseEnter={() => setShowEditIcon(true)}
                    onMouseLeave={() => setShowEditIcon(false)}
                >
                    <div className="w-8 h-8 bg-[#6032F6] rounded-full flex items-center justify-center text-xs font-bold mr-2">{initials}</div>
                    <span className="bg-green-500 h-1.5 w-1.5 rounded-full mr-1"></span>
                    <span className="text-[#A3A3A3] text-sm">{displayName}</span>
                    {showEditIcon && (
                        <Edit2
                            className="w-2 h-4 ml-2 cursor-pointer text-[#A3A3A3] hover:text-white transition-colors"
                            onClick={openUsernameModal}
                        />
                    )}
                </div>

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
                        className="w-full md:w-[42%] rounded-lg p-6 cursor-pointer transition-all duration-300 ease-in-out bg-gradient-to-br from-[#6032F6] to-[#381D90] hover:from-[#4C28C4] hover:to-[#2D1873] flex flex-col justify-between"
                        onClick={openCreateModal}
                        style={{ minHeight: "200px" }}
                    >
                        <div>
                            <Image src="/images/play-add.svg" alt="Create Session" width={32} height={32} className="mb-4" />
                            <h2 className="text-2xl font-semibold mb-2 text-white">Create Session</h2>
                        </div>
                        <p className="text-[#E9D5FF] text-sm">
                            Start a meeting or podcast session in seconds - collaborate, share, and record with ease!
                        </p>
                    </div>
                </div>
            </div>
            <button className="text-[#A3A3A3] hover:text-white transition-colors flex items-center gap-2 text-sm">
                <Settings className="w-4 h-4" /> Settings
            </button>
            <CreateSessionModal isOpen={isCreateModalOpen} onClose={closeCreateModal} onCreateSession={handleCreateSession} />
            <CreatedSessionModal
                isOpen={isCreatedModalOpen}
                onClose={closeCreatedModal}
                inviteLink={inviteLink}
                sessionCode={sessionCode}
                isJoining={isJoining}
                onJoinSession={handleJoinSession}
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
