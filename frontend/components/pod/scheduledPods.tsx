"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

interface ScheduledSession {
    id: string
    title: string
    date: string
    time: string
}

export default function ScheduledPods({
    sessions = [
        {
            id: "1",
            title: "Session title",
            date: "31/12/2024",
            time: "13:00"
        }
    ]
}: {
    sessions?: ScheduledSession[]
}) {
    return (
        <div className="w-full max-w-2xl mx-auto mb-8">
            <div className="space-y-2">
                {sessions.map((session) => (
                    <div
                        key={session.id}
                        className="flex items-center justify-between w-full bg-[#1E1E1E] rounded-[10px] p-4 hover:bg-[#2C2C2C] transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#2C2C2C] flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-[#6032F6]" />
                            </div>
                            <div>
                                <h3 className="text-white font-medium">{session.title}</h3>
                                <p className="text-sm text-[#A3A3A3]">
                                    {session.date} @ {session.time}
                                </p>
                            </div>
                        </div>
                        <Button
                            className="bg-[#6032F6] hover:bg-[#4C28C4] text-white rounded-[10px] px-6"
                        >
                            Join session
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}