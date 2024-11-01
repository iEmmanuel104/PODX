"use client";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

interface CallCreator {
    id: string;
    name: string;
    custom?: {
        username?: string;
        walletAddress?: string;
    };
}

export interface StreamCallData {
    id: string;
    custom: {
        title: string;
        sessionId: string;
        type: string;
    };
    created_by: CallCreator;
    starts_at?: string;
    session?: {
        participants: Array<{
            user: CallCreator;
            role: string;
        }>;
    };
}

interface ScheduledPodsProps {
    sessions: StreamCallData[];
    onJoinSession: (sessionId: string) => void;
    currentUserId: string;
}

export default function ScheduledPods({ sessions, onJoinSession, currentUserId }: ScheduledPodsProps) {
    if (!sessions.length) {
        return <div className="w-full max-w-2xl mx-auto mb-8 text-center text-[#A3A3A3]">No scheduled sessions available</div>;
    }

    return (
        <div className="w-full max-w-2xl mx-auto mb-8">
            <h2 className="text-xl font-semibold mb-4 text-white">Scheduled Sessions</h2>
            <div className="space-y-2">
                {sessions.map((session) => {
                    const isCreator = session.created_by.id === currentUserId;
                    const startsAt = session.starts_at ? new Date(session.starts_at) : null;

                    return (
                        <div
                            key={session.id}
                            className="flex items-center justify-between w-full bg-[#1E1E1E] rounded-[10px] p-4 hover:bg-[#2C2C2C] transition-colors"
                        >
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
                                className={`${
                                    isCreator ? "bg-[#6032F6] hover:bg-[#4C28C4]" : "bg-[#2C2C2C] hover:bg-[#3C3C3C]"
                                } text-white rounded-[10px] px-6`}
                                onClick={() => onJoinSession(session.id)}
                                disabled={!isCreator}
                                title={!isCreator ? "Only the host can join this session" : undefined}
                            >
                                {isCreator ? "Join session" : "Host only"}
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
