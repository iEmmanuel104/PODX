"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, Video } from "lucide-react";

interface CreateSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateSession: (title: string, type: "Audio Session" | "Video Session") => void;
}

const CreateSessionModal: React.FC<CreateSessionModalProps> = ({ isOpen, onClose, onCreateSession }) => {
    const [sessionTitle, setSessionTitle] = useState("Demo Session");
    const [sessionType, setSessionType] = useState<"Audio Session" | "Video Session">("Video Session");
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateSession = () => {
        if (!sessionTitle.trim()) return;
        setIsCreating(true);
        onCreateSession(sessionTitle, sessionType);
        setIsCreating(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#1E1E1E] text-white rounded-[10px] p-6 w-full max-w-md">
                <DialogHeader className="flex flex-row justify-between items-center mb-6">
                    <DialogTitle className="text-2xl font-semibold">Create session</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                    <div>
                        <label htmlFor="sessionTitle" className="block text-[#A3A3A3] mb-2">
                            Session title
                        </label>
                        <Input
                            id="sessionTitle"
                            value={sessionTitle}
                            onChange={(e) => setSessionTitle(e.target.value)}
                            className="w-full bg-[#2C2C2C] rounded-[10px] px-4 py-2 border-[#3c3c3c] active:border-[#3c3c3c] active:ring-[#3c3c3c]"
                        />
                    </div>
                    <div>
                        <label htmlFor="sessionType" className="block text-[#A3A3A3] mb-2">
                            Session type
                        </label>
                        <Select value={sessionType} onValueChange={(value: string) => setSessionType(value as "Audio Session" | "Video Session")}>
                            <SelectTrigger className="w-full bg-[#2C2C2C] rounded-[10px] px-4 py-2 border-[#3c3c3c] active:border-[#3c3c3c] active:ring-[#3c3c3c]">
                                <SelectValue>
                                    {sessionType === "Audio Session" && <Mic className="h4 w-6 text-[#6032F6] inline-flex mr-2" />}
                                    {sessionType === "Video Session" && <Video className="h4 w-6 text-[#6032F6] inline-flex mr-2" />}
                                    {sessionType}
                                    {sessionType === "Audio Session" && (<span className="mx-2 rounded-full p-1 bg-[#DDB958] text-black">Coming soon</span>)}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-[#2C2C2C] text-white">
                                <SelectItem value="Audio Session" className="flex items-center hover:bg-red-300">
                                    <Mic className="h4 w-6 text-[#6032F6] inline-flex mr-2" />
                                    Audio Session <span className="mx-2 rounded-full p-1 bg-[#DDB958] text-black">Coming soon</span>
                                </SelectItem>
                                <SelectItem value="Video Session">
                                    <Video className="h4 w-6 text-[#6032F6] inline-flex mr-2" />
                                    Video Session
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center justify-between">
                        <label htmlFor="proofOfAttendance" className="block text-[#A3A3A3] mb-2">
                            Proof of attendance
                        </label>
                        <Switch
                            // checked={true}
                            onCheckedChange={() => { }}
                            id="proof-of-attendance"
                        />
                    </div>
                    <div className="flex justify-between gap-6 pt-3">
                        <Button onClick={onClose} className="w-1/2 px-4 py-6 bg-[#2C2C2C] rounded-[10px] hover:bg-[#3C3C3C] transition-colors">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateSession}
                            disabled={!sessionTitle.trim() || isCreating}
                            className="w-1/2 px-4 py-6 bg-[#6032F6] rounded-[10px] hover:bg-[#6D28D9] transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            {isCreating ? "Creating..." : "Create session"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreateSessionModal;
