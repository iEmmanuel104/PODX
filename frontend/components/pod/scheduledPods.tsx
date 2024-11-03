import React, { useState, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Link, Copy, Check, Share2, Search, X } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { StreamCallData } from "./streamCallData";

interface ScheduledPodsProps {
    sessions: StreamCallData[];
    onJoinSession: (sessionId: string) => void;
    currentUserId: string;
    isLoading?: boolean;
    foundSession?: StreamCallData;
    onClearFoundSession?: () => void;
}

// Types for internal state
interface ShareSessionState {
    isOpen: boolean;
    sessionId: string;
    sessionTitle: string;
    startTime: Date;
}

// Utility functions
const canJoinSession = (startsAt: string) => {
    const startTime = new Date(startsAt);
    const now = new Date();
    const minutesUntilStart = differenceInMinutes(startTime, now);
    return minutesUntilStart <= 5 && minutesUntilStart >= -60;
};

const getSessionStatus = (startsAt: string) => {
    const startTime = new Date(startsAt);
    const now = new Date();
    const minutesUntilStart = differenceInMinutes(startTime, now);

    if (minutesUntilStart > 5) {
        return {
            text: `Starts in ${Math.floor(minutesUntilStart / 60)}h ${minutesUntilStart % 60}m`,
            color: "text-[#A3A3A3]",
        };
    } else if (minutesUntilStart > -60) {
        return {
            text: minutesUntilStart > 0 ? "Starting soon" : "In progress",
            color: "text-green-500",
        };
    } else {
        return {
            text: "Ended",
            color: "text-red-500",
        };
    }
};

// Memoized components
const ShareDialog = memo(function ShareDialog({
    isOpen,
    onClose,
    sessionId,
    sessionTitle,
    startTime,
}: {
    isOpen: boolean;
    onClose: () => void;
    sessionId: string;
    sessionTitle: string;
    startTime: Date;
}) {
    const [linkCopied, setLinkCopied] = useState(false);
    const [codeCopied, setCodeCopied] = useState(false);
    const inviteLink = `https://www.podx.fun/pod/join/${sessionId}`;

    const copyToClipboard = async (text: string, isLink: boolean) => {
        try {
            await navigator.clipboard.writeText(text);
            const setter = isLink ? setLinkCopied : setCodeCopied;
            setter(true);
            setTimeout(() => setter(false), 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#1E1E1E] text-white rounded-[10px] p-6 w-full max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold mb-4">Share Session</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {/* Share link section */}
                    <div>
                        <label className="text-[#A3A3A3] mb-2 flex items-center text-sm">
                            <Link className="w-4 h-4 mr-2" />
                            Invite link
                        </label>
                        <div className="flex gap-2">
                            <Input value={inviteLink} readOnly className="flex-1 bg-[#2C2C2C] text-sm border-[#3c3c3c]" />
                            <Button onClick={() => copyToClipboard(inviteLink, true)} className="bg-[#6032F6] hover:bg-[#4C28C4]" size="icon">
                                {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* Meeting code section */}
                    <div>
                        <label className="text-[#A3A3A3] mb-2 flex items-center text-sm">
                            <Calendar className="w-4 h-4 mr-2" />
                            Meeting code
                        </label>
                        <div className="flex gap-2">
                            <Input value={sessionId} readOnly className="flex-1 bg-[#2C2C2C] text-sm border-[#3c3c3c]" />
                            <Button onClick={() => copyToClipboard(sessionId, false)} className="bg-[#6032F6] hover:bg-[#4C28C4]" size="icon">
                                {codeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* Session details */}
                    <div className="pt-2 text-sm text-[#A3A3A3]">
                        <p>Session Details:</p>
                        <p>Title: {sessionTitle}</p>
                        <p>Start time: {format(startTime, "PPP 'at' p")}</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
});

// SessionCard component
const SessionCard = memo(function SessionCard({
    session,
    currentUserId,
    onJoinSession,
    onShareSession,
    showFoundBadge = false,
    onClose, // Add this prop
}: {
    session: StreamCallData;
    currentUserId: string;
    onJoinSession: (id: string) => void;
    onShareSession: (data: ShareSessionState) => void;
    showFoundBadge?: boolean;
    onClose?: () => void;
}) {
    const isCreator = session.created_by.id === currentUserId;
    const startsAt = session.starts_at ? new Date(session.starts_at) : null;
    const status = startsAt ? getSessionStatus(session.starts_at) : null;
    const canJoin = startsAt ? canJoinSession(session.starts_at) : false;

    const handleJoinClick = () => {
        // Validate join conditions here
        if (!canJoin) {
            return; // Button will be disabled
        }

        if (!isCreator && status?.text !== "In progress") {
            return; // Button will be disabled
        }

        onJoinSession(session.id);
    };

    return (
        <div className="relative">
            {showFoundBadge && (
                <div className="absolute -top-6 left-0 right-0 flex justify-between items-center">
                    <div className="text-sm text-[#A3A3A3] flex items-center">
                        <Search className="w-4 h-4 mr-2" />
                        Found Session
                    </div>
                    {onClose && (
                        <Button variant="ghost" size="sm" className="text-[#A3A3A3] hover:text-white p-1 h-auto" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            )}
            <div className="flex items-center justify-between w-full bg-[#1E1E1E] rounded-[10px] p-4 hover:bg-[#2C2C2C] transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2C2C2C] flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-[#6032F6]" />
                    </div>
                    <div>
                        <h3 className="text-white font-medium">{session.custom.title}</h3>
                        <p className="text-sm text-[#A3A3A3]">{startsAt ? format(startsAt, "PPP 'at' p") : "Time not set"}</p>
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-[#A3A3A3]">Host: {session.created_by.custom?.username || session.created_by.name}</p>
                            {status && <span className={`text-xs ${status.color}`}>• {status.text}</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isCreator && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-[#6032F6] hover:text-[#4C28C4] hover:bg-[#2C2C2C]"
                            onClick={() =>
                                onShareSession({
                                    isOpen: true,
                                    sessionId: session.id,
                                    sessionTitle: session.custom.title,
                                    startTime: new Date(session.starts_at),
                                })
                            }
                            title="Share session"
                        >
                            <Share2 className="h-5 w-5" />
                        </Button>
                    )}
                    <Button
                        className={`
                            ${
                                canJoin && (isCreator || status?.text === "In progress")
                                    ? "bg-[#6032F6] hover:bg-[#4C28C4]"
                                    : "bg-[#2C2C2C] hover:bg-[#3C3C3C]"
                            } text-white rounded-[10px] px-6
                        `}
                        onClick={handleJoinClick}
                        disabled={!canJoin || (!isCreator && status?.text !== "In progress")}
                        title={getButtonTitle(isCreator, canJoin, status?.text)}
                    >
                        {getButtonText(isCreator, canJoin, status?.text)}
                    </Button>
                </div>
            </div>
        </div>
    );
});

// Main component
export default function ScheduledPods({ sessions, foundSession, onJoinSession, currentUserId, isLoading, onClearFoundSession }: ScheduledPodsProps) {
    const [showAllSessions, setShowAllSessions] = useState(false);
    const [shareSession, setShareSession] = useState<ShareSessionState | null>(null);

    // Memoize session calculations
    const { upcomingSessions } = useMemo(() => {
        const userSessions = sessions.filter(
            (session) => session.created_by.id === currentUserId || differenceInMinutes(new Date(session.starts_at), new Date()) <= 5
        );

        const sorted = [...userSessions].sort((a, b) => {
            const dateA = a.starts_at ? new Date(a.starts_at).getTime() : 0;
            const dateB = b.starts_at ? new Date(b.starts_at).getTime() : 0;
            return dateA - dateB;
        });

        const upcoming = sorted.filter((session) => differenceInMinutes(new Date(session.starts_at), new Date()) > -60);

        return { upcomingSessions: upcoming };
    }, [sessions, currentUserId]);

    if (isLoading) {
        return (
            <div className="w-full max-w-2xl mx-auto mb-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-[#1E1E1E] rounded w-1/3" />
                    <div className="h-24 bg-[#1E1E1E] rounded" />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="w-full max-w-2xl mx-auto mb-8">
                {/* Found Session Section */}
                {foundSession && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-white mb-4">Found Session</h2>
                        <SessionCard
                            session={foundSession}
                            currentUserId={currentUserId}
                            onJoinSession={onJoinSession}
                            onShareSession={setShareSession}
                            showFoundBadge={true}
                            onClose={onClearFoundSession}
                        />
                    </div>
                )}

                {/* User's Scheduled Sessions Section */}
                <div>
                    {upcomingSessions.length === 0 ? (
                        <div className="text-center text-[#A3A3A3] py-4">No scheduled sessions available</div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-white">Your Scheduled Sessions</h2>
                                {upcomingSessions.length > 1 && (
                                    <Button variant="ghost" onClick={() => setShowAllSessions(true)} className="text-[#6032F6] hover:text-[#4C28C4]">
                                        View All ({upcomingSessions.length})
                                    </Button>
                                )}
                            </div>
                            {upcomingSessions.slice(0, 1).map((session) => (
                                <SessionCard
                                    key={session.id}
                                    session={session}
                                    currentUserId={currentUserId}
                                    onJoinSession={onJoinSession}
                                    onShareSession={setShareSession}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* View All Dialog */}
            <Dialog open={showAllSessions} onOpenChange={setShowAllSessions}>
                <DialogContent className="bg-black border-[#2C2C2C] max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-white">All Scheduled Sessions</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        {foundSession && (
                            <div className="border-b border-[#2C2C2C] pb-4 mb-4">
                                <h3 className="text-sm font-medium text-[#A3A3A3] mb-3">Found Session</h3>
                                <SessionCard
                                    session={foundSession}
                                    currentUserId={currentUserId}
                                    onJoinSession={onJoinSession}
                                    onShareSession={setShareSession}
                                    showFoundBadge={true}
                                    onClose={onClearFoundSession}
                                />
                            </div>
                        )}

                        <div>
                            <h3 className="text-sm font-medium text-[#A3A3A3] mb-3">Your Sessions</h3>
                            <div className="space-y-2">
                                {upcomingSessions.map((session) => (
                                    <SessionCard
                                        key={session.id}
                                        session={session}
                                        currentUserId={currentUserId}
                                        onJoinSession={onJoinSession}
                                        onShareSession={setShareSession}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Share Dialog */}
            {shareSession && (
                <ShareDialog
                    isOpen={shareSession.isOpen}
                    onClose={() => setShareSession(null)}
                    sessionId={shareSession.sessionId}
                    sessionTitle={shareSession.sessionTitle}
                    startTime={shareSession.startTime}
                />
            )}
        </>
    );
}

function getButtonTitle(isCreator: boolean, canJoin: boolean, status?: string): string {
    if (!canJoin) {
        return "Session can only be joined 5 minutes before start time";
    }
    if (!isCreator && status !== "In progress") {
        return "Only the host can join before the session starts";
    }
    return "Join session";
}

function getButtonText(isCreator: boolean, canJoin: boolean, status?: string): string {
    if (!canJoin) {
        return "Not started";
    }
    if (!isCreator && status !== "In progress") {
        return "Waiting for host";
    }
    return "Join session";
}
