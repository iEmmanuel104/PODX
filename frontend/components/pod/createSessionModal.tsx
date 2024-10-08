"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, ChevronDown } from "lucide-react";

interface CreateSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateSession: (title: string, type: string) => void;
}

const CreateSessionModal: React.FC<CreateSessionModalProps> = ({ isOpen, onClose, onCreateSession }) => {
    const [sessionTitle, setSessionTitle] = useState("Session-1");
    const [sessionType, setSessionType] = useState("Audio Session");

    const handleCreateSession = () => {
        onCreateSession(sessionTitle, sessionType);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#1E1E1E] text-white rounded-lg p-6 w-full max-w-md">
                <DialogHeader className="flex justify-between items-center mb-6">
                    <DialogTitle className="text-2xl font-semibold">Create session</DialogTitle>
                    <button onClick={onClose} className="text-[#A3A3A3] hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </DialogHeader>
                <div className="space-y-4">
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
                        <Select value={sessionType} onValueChange={setSessionType}>
                            <SelectTrigger className="w-full bg-[#2C2C2C] rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]">
                                <SelectValue>{sessionType}</SelectValue>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#2C2C2C] text-white">
                                <SelectItem value="Audio Session">Audio Session</SelectItem>
                                <SelectItem value="Video Session">Video Session</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                        <Button onClick={onClose} className="px-4 py-2 bg-[#2C2C2C] rounded-md hover:bg-[#3C3C3C] transition-colors">
                            Cancel
                        </Button>
                        <Button onClick={handleCreateSession} className="px-4 py-2 bg-[#7C3AED] rounded-md hover:bg-[#6D28D9] transition-colors">
                            Create session
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreateSessionModal;
