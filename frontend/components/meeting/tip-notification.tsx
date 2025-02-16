"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface Tip {
    from: string;
    amount: string;
    profileImage?: string;
}

interface TipNotificationProps {
    tip: Tip;
    onClose: () => void;
}

export default function TipNotification({ tip, onClose }: TipNotificationProps) {
    // Automatically close the notification after 5 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000); // 5 seconds

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed bottom-4 left-4 animate-in slide-in-from-bottom-4">
            <div className="bg-[#1C1C1C] rounded-xl p-4 min-w-[420px] shadow-lg border border-zinc-800">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Image
                                src={tip.profileImage || '/images/default-avatar.png'}
                                alt="Profile"
                                width={36}
                                height={36}
                                className="rounded-full"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-[#6366F1] rounded-full w-4 h-4 flex items-center justify-center">
                                <span className="text-[10px]">1</span>
                            </div>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-white text-base font-medium">You just got tipped 🎉</p>
                            <p className="text-sm">
                                <span className="text-[#B3B3B3]">{tip.from}</span> just tipped you{' '}
                                <span className="text-[#DDB958]">{tip.amount}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose} // Trigger the onClose callback
                            className="text-zinc-400 hover:text-white transition-colors p-1"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}