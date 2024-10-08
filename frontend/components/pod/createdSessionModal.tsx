"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Link, AlertCircle } from "lucide-react";

interface CreatedSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    inviteLink: string;
    sessionCode: string;
}

const CreatedSessionModal: React.FC<CreatedSessionModalProps> = ({ isOpen, onClose, inviteLink, sessionCode }) => {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#1E1E1E] text-white rounded-lg p-6 w-full max-w-md">
                <DialogHeader className="flex justify-between items-center mb-6">
                    <DialogTitle className="text-2xl font-semibold">Your session is created</DialogTitle>
                    <button onClick={onClose} className="text-[#A3A3A3] hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <label className="text-[#A3A3A3] mb-2 flex items-center">
                            <Link className="w-4 h-4 mr-2" />
                            Share invite link
                        </label>
                        <div className="flex">
                            <Input
                                type="text"
                                value={inviteLink}
                                readOnly
                                className="flex-1 bg-[#2C2C2C] rounded-l-md px-4 py-2 focus:outline-none"
                            />
                            <Button
                                onClick={() => copyToClipboard(inviteLink)}
                                className="bg-[#7C3AED] text-white px-4 py-2 rounded-r-md hover:bg-[#6D28D9] transition-colors"
                            >
                                Copy Link
                            </Button>
                        </div>
                    </div>
                    <div className="text-center text-[#A3A3A3]">OR</div>
                    <div>
                        <label className="block text-[#A3A3A3] mb-2">Session code</label>
                        <div className="flex">
                            <Input
                                type="text"
                                value={sessionCode}
                                readOnly
                                className="flex-1 bg-[#2C2C2C] rounded-l-md px-4 py-2 focus:outline-none"
                            />
                            <Button
                                onClick={() => copyToClipboard(sessionCode)}
                                className="bg-[#7C3AED] text-white px-4 py-2 rounded-r-md hover:bg-[#6D28D9] transition-colors"
                            >
                                Copy
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-start text-[#A3A3A3] text-sm">
                        <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <p>For the best experience, remind participants to connect their wallet when joining through the session link</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreatedSessionModal;
