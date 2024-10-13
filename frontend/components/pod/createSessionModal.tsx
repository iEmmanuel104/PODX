"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreateSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateSession: (title: string, type: "Audio Session" | "Video Session") => void;
}

const CreateSessionModal: React.FC<CreateSessionModalProps> = ({ isOpen, onClose, onCreateSession }) => {
    const [sessionTitle, setSessionTitle] = useState("Session-1");
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
            <DialogContent className="bg-[#1E1E1E] text-white rounded-lg p-6 w-full max-w-md">
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
                            className="w-full bg-[#2C2C2C] rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                        />
                    </div>
                    <div>
                        <label htmlFor="sessionType" className="block text-[#A3A3A3] mb-2">
                            Session type
                        </label>
                        <Select value={sessionType} onValueChange={(value: string) => setSessionType(value as "Audio Session" | "Video Session")}>
                            <SelectTrigger className="w-full bg-[#2C2C2C] rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]">
                                <SelectValue>{sessionType}</SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-[#2C2C2C] text-white">
                                <SelectItem value="Audio Session">Audio Session</SelectItem>
                                <SelectItem value="Video Session">Video Session</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-between gap-6 pt-3">
                        <Button onClick={onClose} className="w-1/2 px-4 py-6 bg-[#2C2C2C] rounded-md hover:bg-[#3C3C3C] transition-colors">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateSession}
                            disabled={!sessionTitle.trim() || isCreating}
                            className="w-1/2 px-4 py-6 bg-[#6032F6] rounded-md hover:bg-[#6D28D9] transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
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
