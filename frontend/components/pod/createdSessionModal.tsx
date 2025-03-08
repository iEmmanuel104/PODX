'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, AlertCircle, Check, Loader2 } from 'lucide-react';
import DotPattern from '../ui/dot-pattern';
import { cn } from '@/lib/utils';

interface CreatedSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    inviteLink: string;
    sessionCode: string;
    isJoining: boolean;
    onJoinSession: () => void;
    scheduledTime?: string;
}

const CreatedSessionModal: React.FC<CreatedSessionModalProps> = ({
    isOpen,
    onClose,
    inviteLink,
    sessionCode,
    isJoining,
    onJoinSession,
    scheduledTime,
}) => {
    const [linkCopied, setLinkCopied] = useState(false);
    const [codeCopied, setCodeCopied] = useState(false);
    const [isCopyingLink, setIsCopyingLink] = useState(false);
    const [isCopyingCode, setIsCopyingCode] = useState(false);
    const [isJoiningInternal, setIsJoiningInternal] = useState(false);
    
    const isScheduled = !!scheduledTime;
    const formattedScheduledTime = isScheduled
        ? new Date(scheduledTime).toLocaleString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        })
        : '';

    useEffect(() => {
        setIsJoiningInternal(isJoining);
    }, [isJoining]);

    const handleJoinSession = async () => {
        setIsJoiningInternal(true);
        try {
            await onJoinSession();
        } catch (error) {
            console.error('Join session error:', error);
            setIsJoiningInternal(false);
        }
    };

    const handleModalClose = () => {
        onClose();
        
        // Remove the automatic scrolling behavior
    };

    const copyToClipboard = async (text: string, isCopyingLink: boolean) => {
        if (isCopyingLink) {
            setIsCopyingLink(true);
        } else {
            setIsCopyingCode(true);
        }

        try {
            await navigator.clipboard.writeText(text);
            if (isCopyingLink) {
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
            } else {
                setCodeCopied(true);
                setTimeout(() => setCodeCopied(false), 2000);
            }
        } catch (error) {
            console.error('Failed to copy text: ', error);
        } finally {
            if (isCopyingLink) {
                setIsCopyingLink(false);
            } else {
                setIsCopyingCode(false);
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleModalClose}>
            <DialogContent
                className={`
                bg-[#1E1E1E] text-white rounded-[20px] sm:rounded-[20px] p-6 w-full max-w-[90%] sm:max-w-md mx-auto 
                overflow-hidden max-h-[90vh] border border-white/[0.1]
            `}
            >
                {/* Background gradient - moved behind content */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-bl from-white/[0.1] via-transparent to-transparent" />
                </div>
                <DotPattern
                    width={20}
                    height={20}
                    cx={2}
                    cy={2}
                    cr={1}
                    className={cn(
                        '[mask-image:radial-gradient(to_bottom_right,white,transparent,transparent)] rounded-[20px] top-[6px] left-[5px] px-[10px] -z-10'
                    )}
                />
                <DialogHeader className="flex flex-row justify-between items-center mb-6">
                    <DialogTitle className="text-2xl font-semibold">
                        {isScheduled ? 'Session scheduled' : 'Your session is created'}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {isScheduled && (
                        <div className="bg-[#2A2A2A] p-4 rounded-lg mb-4">
                            <div className="flex items-center mb-2">
                                <AlertCircle className="text-[#DDB958] w-5 h-5 mr-2" />
                                <span className="text-[#DDB958] font-medium">Scheduled for:</span>
                            </div>
                            <p className="text-white">{formattedScheduledTime}</p>
                            <p className="text-[#A3A3A3] text-sm mt-2">
                                Your scheduled session appears in the "Your Scheduled Sessions" list below.
                            </p>
                        </div>
                    )}
                    
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
                                className="flex-1 bg-[#2C2C2C] rounded-[10px] px-4 py-2 text-sm focus:outline-none text-white placeholder-[#6C6C6C]"
                            />
                            <Button
                                onClick={() => copyToClipboard(inviteLink, true)}
                                variant="default"
                                size="default"
                                className="bg-[#6032F6] text-white hover:bg-[#4C28C4] transition-all duration-300 ease-in-out"
                                disabled={isCopyingLink}
                            >
                                {isCopyingLink ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : linkCopied ? (
                                    <Check className="w-4 h-4 mr-2" />
                                ) : null}
                                {isCopyingLink
                                    ? 'Copying...'
                                    : linkCopied
                                    ? 'Copied!'
                                    : 'Copy Link'}
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
                                className="flex-1 bg-[#2C2C2C] rounded-[10px] px-4 py-2 text-sm focus:outline-none text-white placeholder-[#6C6C6C]"
                            />
                            <Button
                                onClick={() => copyToClipboard(sessionCode, false)}
                                variant="default"
                                size="default"
                                className="bg-[#6032F6] text-white hover:bg-[#4C28C4] transition-all duration-300 ease-in-out"
                                disabled={isCopyingCode}
                            >
                                {isCopyingCode ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : codeCopied ? (
                                    <Check className="w-4 h-4 mr-2" />
                                ) : null}
                                {isCopyingCode ? 'Copying...' : codeCopied ? 'Copied!' : 'Copy'}
                            </Button>
                        </div>
                    </div>
                    
                    {isScheduled ? (
                        <Button
                            onClick={handleModalClose}
                            variant="default"
                            size="lg"
                            className="w-full bg-[#6032F6] text-white hover:bg-[#4C28C4] transition-all duration-300 ease-in-out mt-4 rounded-[10px] py-3"
                        >
                            View Scheduled Sessions
                        </Button>
                    ) : (
                        <Button
                            onClick={handleJoinSession}
                            variant="default"
                            size="lg"
                            className="w-full bg-[#DDB958] text-black hover:bg-[#DDB958] transition-all duration-300 ease-in-out mt-4 rounded-[10px] py-3"
                            disabled={isJoiningInternal}
                        >
                            {isJoiningInternal ? (
                                <div className="flex items-center justify-center">
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    <span>Joining...</span>
                                </div>
                            ) : (
                                'Join Session Now'
                            )}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreatedSessionModal;
