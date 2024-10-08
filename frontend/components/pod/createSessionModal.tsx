import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreateSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreateSessionModal: React.FC<CreateSessionModalProps> = ({ isOpen, onClose }) => {
    const [sessionTitle, setSessionTitle] = useState("Session-1");
    const [sessionType, setSessionType] = useState("Audio Session");

    const handleCreateSession = () => {
        // Implement session creation logic here
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-gray-800 text-white">
                <DialogHeader>
                    <DialogTitle>Create session</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="sessionTitle" className="block text-sm font-medium text-gray-400">
                            Session title
                        </label>
                        <Input id="sessionTitle" value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                        <label htmlFor="sessionType" className="block text-sm font-medium text-gray-400">
                            Session type
                        </label>
                        <Select value={sessionType} onValueChange={setSessionType}>
                            <SelectTrigger className="mt-1">
                                <SelectValue>{sessionType}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Audio Session">Audio Session</SelectItem>
                                <SelectItem value="Video Session">Video Session</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateSession}>Create session</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreateSessionModal;
