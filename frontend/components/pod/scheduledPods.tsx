'use client';
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { StreamCallData } from "./StreamCallData";

interface ScheduledPodsProps {
    sessions: StreamCallData[];
    onJoinSession: (sessionId: string) => void;
    currentUserId: string;
    isLoading?: boolean;
}

export default function ScheduledPods({ sessions, onJoinSession, currentUserId, isLoading }: ScheduledPodsProps) {
    const [showAllSessions, setShowAllSessions] = useState(false);

    if (isLoading) {
        return (
            <div className="w-full max-w-2xl mx-auto mb-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-[#1E1E1E] rounded w-1/3"></div>
                    <div className="h-24 bg-[#1E1E1E] rounded"></div>
                </div>
            </div>
        );
    }

    if (!sessions.length) {
        return <div className="w-full max-w-2xl mx-auto mb-8 text-center text-[#A3A3A3]">No scheduled sessions available</div>;
    }

    const sortedSessions = [...sessions].sort((a, b) => {
        const dateA = a.starts_at ? new Date(a.starts_at).getTime() : 0;
        const dateB = b.starts_at ? new Date(b.starts_at).getTime() : 0;
        return dateA - dateB;
    });

    const upcomingSessions = sortedSessions.filter((session) => session.starts_at && new Date(session.starts_at) > new Date());

    const SessionCard = ({ session }: { session: StreamCallData }) => {
        const isCreator = session.created_by.id === currentUserId;
        const startsAt = session.starts_at ? new Date(session.starts_at) : null;

        return (
            <div className="flex items-center justify-between w-full bg-[#1E1E1E] rounded-[10px] p-4 hover:bg-[#2C2C2C] transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2C2C2C] flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-[#6032F6]" />
                    </div>
                    <div>
                        <h3 className="text-white font-medium">{session.custom.title}</h3>
                        <p className="text-sm text-[#A3A3A3]">{startsAt ? format(startsAt, "PPP 'at' p") : "Time not set"}</p>
                        <p className="text-xs text-[#A3A3A3]">Host: {session.created_by.custom?.username || session.created_by.name}</p>
                    </div>
                </div>
                <Button
                    className={`${isCreator ? "bg-[#6032F6] hover:bg-[#4C28C4]" : "bg-[#2C2C2C] hover:bg-[#3C3C3C]"} text-white rounded-[10px] px-6`}
                    onClick={() => onJoinSession(session.id)}
                    disabled={!isCreator}
                    title={!isCreator ? "Only the host can join this session" : undefined}
                >
                    {isCreator ? "Join session" : "Host only"}
                </Button>
            </div>
        );
    };

    // Show either the first session or all sessions in a modal
    return (
        <>
            <div className="w-full max-w-2xl mx-auto mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">Scheduled Sessions</h2>
                    {upcomingSessions.length > 1 && (
                        <Button variant="ghost" onClick={() => setShowAllSessions(true)} className="text-[#6032F6] hover:text-[#4C28C4]">
                            View All ({upcomingSessions.length})
                        </Button>
                    )}
                </div>
                <div className="space-y-2">
                    {upcomingSessions.slice(0, 1).map((session) => (
                        <SessionCard key={session.id} session={session} />
                    ))}
                </div>
            </div>

            <Dialog open={showAllSessions} onOpenChange={setShowAllSessions}>
                <DialogContent className="bg-black border-[#2C2C2C] max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-white">All Scheduled Sessions</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {upcomingSessions.map((session) => (
                            <SessionCard key={session.id} session={session} />
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
