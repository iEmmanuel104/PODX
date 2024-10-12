"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, AlertCircle, Check } from "lucide-react";

interface CreatedSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    inviteLink: string;
    sessionCode: string;
    onJoinSession: () => void;
}

const CreatedSessionModal: React.FC<CreatedSessionModalProps> = ({ isOpen, onClose, inviteLink, sessionCode, onJoinSession }) => {
    const [copyAlert, setCopyAlert] = useState<string | null>(null);

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (copyAlert) {
            timeout = setTimeout(() => {
                setCopyAlert(null);
            }, 2000);
        }
        return () => clearTimeout(timeout);
    }, [copyAlert]);

    const copyToClipboard = (text: string, type: "link" | "code") => {
        navigator.clipboard.writeText(text);
        setCopyAlert(type === "link" ? "Invite link copied!" : "Session code copied!");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#1E1E1E] text-white rounded-lg p-6 w-full max-w-md">
                <DialogHeader className="flex flex-row justify-between items-center mb-6">
                    <DialogTitle className="text-2xl font-semibold">Your session is created</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <label className="text-[#A3A3A3] mb-2 flex items-center">
                            <Link className="w-4 h-4 mr-2" />
                            Share invite link
                        </label>
                        <div className="flex gap-4 align-baseline">
                            <Input
                                type="text"
                                value={inviteLink}
                                readOnly
                                className="flex-1 bg-[#2C2C2C] rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6032F6] text-white placeholder-[#6C6C6C]"
                            />
                            <Button
                                onClick={() => copyToClipboard(inviteLink, "link")}
                                className="bg-[#6032F6] text-white px-4 py-2 rounded-md hover:bg-[#4C28C4] transition-all duration-300 ease-in-out text-sm font-medium"
                            >
                                Copy Link
                            </Button>
                        </div>
                    </div>
                    <div className="text-center text-[#A3A3A3]">OR</div>
                    <div>
                        <label className="block text-[#A3A3A3] mb-2">Session code</label>
                        <div className="flex gap-4 align-baseline">
                            <Input
                                type="text"
                                value={sessionCode}
                                readOnly
                                className="flex-1 bg-[#2C2C2C] rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6032F6] text-white placeholder-[#6C6C6C]"
                            />
                            <Button
                                onClick={() => copyToClipboard(sessionCode, "code")}
                                className="bg-[#6032F6] text-white px-8 py-2 rounded-md hover:bg-[#4C28C4] transition-all duration-300 ease-in-out text-sm font-medium"
                            >
                                Copy
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-start text-[#CBAC58] text-sm justify-center">
                        <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <p>For the best experience, remind participants to connect their wallet when joining through the session link</p>
                    </div>
                    <Button
                        onClick={onJoinSession}
                        className="w-full bg-[#6032F6] text-white px-8 py-4 rounded-md hover:bg-[#4C28C4] transition-all duration-300 ease-in-out text-sm font-medium mt-4"
                    >
                        Join Session Now
                    </Button>
                </div>
                {copyAlert && (
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-md flex items-center">
                        <Check className="w-4 h-4 mr-2" />
                        {copyAlert}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default CreatedSessionModal;