'use client';

import React, { ReactNode } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
    ArrowUpLeftIcon as ArrowUturnLeft,
    LinkIcon,
    Image as ImageIcon,
    ExternalLink,
    Calendar,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { formatDate, formatDuration } from '@/lib/utils';
import { POA, TabType } from '@/types';
import { Call, Tip } from '@/store/user/types';

interface SessionCardItem extends Call {
    userId?: string;
}

interface TipCardItem extends Tip {
    userId?: string;
}

type SessionOrTipWithUser = SessionCardItem | TipCardItem;

export const POADialog = ({ poa }: { poa: POA }) => (
    <Dialog>
        <DialogTrigger asChild>
            <Button variant="link" className="text-[#69CB58] p-0 h-auto">
                Received POA
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md bg-[#1E1E1E] border-white/10">
            <DialogHeader>
                <DialogTitle>Proof of Attendance</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
                <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-white/10">
                    <Image src={poa.image} alt="POA NFT" className="object-cover" fill />
                </div>
                <div className="flex gap-3">
                    <Button
                        className="flex-1 bg-[#6032F6] hover:bg-[#6032F6]/90"
                        onClick={() => {
                            const link = document.createElement('a');
                            link.href = poa.image;
                            link.download = 'poa-nft.png';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                    >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Download Image
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1 border-white/10 hover:bg-white/5"
                        onClick={() => window.open(poa.transaction, '_blank')}
                    >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Transaction
                    </Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
);

export const SessionCard = ({
    session,
    type,
}: {
    session: SessionOrTipWithUser;
    type: TabType;
}) => {
    const formatDateTime = (dateStr: string | Date | undefined) => {
        if (!dateStr) return { date: '-', time: '-' };
        const { date, time } = formatDate(dateStr.toString());
        return { date, time };
    };

    const { date, time } =
        type === 'history'
            ? formatDateTime((session as SessionCardItem).startTime)
            : formatDateTime((session as TipCardItem).timestamp);

    const isTip = 'callId' in session && 'fromUserId' in session;
    const isCall = !isTip;

    const renderSessionTitle = (): string => {
        if (isCall) {
            return ((session as SessionCardItem).custom?.title as string) || '';
        }
        const tip = session as TipCardItem;
        return `Tip ${tip.fromUserId._id === session.userId ? 'to' : 'from'} ${
            tip.fromUserId._id === session.userId ? tip.toUserId.username : tip.fromUserId.username
        }`;
    };

    const renderCallId = (): string => {
        if (isCall) {
            return (session as SessionCardItem).callId.toString();
        }
        return (session as TipCardItem).callId.toString();
    };

    const getTypeDisplay = (): string => {
        if (isCall) {
            return ((session as SessionCardItem).custom?.type as string) || '-';
        }
        return '-';
    };

    return (
        <div className="bg-white/5 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="font-medium">{renderSessionTitle()}</div>
                    <div className="text-sm text-white/60 flex items-center gap-1 mt-1">
                        <LinkIcon className="h-3 w-3" />
                        {renderCallId()}
                    </div>
                </div>
                <div className="text-right text-sm">
                    <div>{date}</div>
                    <div className="text-white/60">{time}</div>
                </div>
            </div>

            {type === 'history' ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <div className="text-white/60 mb-1">Type</div>
                        <span className="px-2 py-1 rounded-full bg-white/10 text-sm">
                            {getTypeDisplay()}
                        </span>
                    </div>
                    <div>
                        <div className="text-white/60 mb-1">Duration</div>
                        <div>{formatDuration((session as SessionCardItem).duration ?? 0)}</div>
                    </div>
                    <div className="col-span-2">
                        <div className="text-white/60 mb-1">POA Status</div>
                        {(session as SessionCardItem).poa ? (
                            <POADialog poa={(session as SessionCardItem).poa!} />
                        ) : (
                            <span className="text-white/60">-</span>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <div className="text-white/60 mb-1">Amount</div>
                        <div>
                            {(session as TipCardItem).amount} {(session as TipCardItem).currency}
                        </div>
                    </div>
                    <div>
                        <div className="text-white/60 mb-1">Status</div>
                        <span
                            className={`px-2 py-1 rounded-full ${
                                (session as TipCardItem).status === 'completed'
                                    ? 'bg-green-500/20 text-green-400'
                                    : (session as TipCardItem).status === 'pending'
                                      ? 'bg-yellow-500/20 text-yellow-400'
                                      : 'bg-red-500/20 text-red-400'
                            }`}
                        >
                            {(session as TipCardItem).status}
                        </span>
                    </div>
                    {(session as TipCardItem).transactionHash && (
                        <div className="col-span-2">
                            <Button
                                variant="link"
                                className="text-white underline hover:text-white/90 p-0 h-auto"
                                onClick={() =>
                                    window.open(
                                        `https://etherscan.io/tx/${(session as TipCardItem).transactionHash}`,
                                        '_blank'
                                    )
                                }
                            >
                                View transaction
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Empty State Component
export const EmptyState = ({ type }: { type: TabType }) => (
    <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-white/40" />
        </div>
        <h3 className="text-xl font-medium text-white mb-2">
            No {type === 'history' ? 'sessions' : 'tips'} yet
        </h3>
        <p className="text-white/60 text-center max-w-md">
            {type === 'history'
                ? 'Join or create a session to start building your activity history.'
                : 'Send or receive tips during sessions to see them here.'}
        </p>
    </div>
);
