'use client';

import React from 'react';
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
                    <img src={poa.image} alt="POA NFT" className="object-cover" />
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

// Mobile Session Card Component
export const SessionCard = ({ session, type }: { session: any; type: TabType }) => {
    const { date, time } = formatDate(
        type === 'history' ? (session.startTime ?? '') : (session.timestamp ?? '')
    );
    return (
        <div className="bg-white/5 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="font-medium">
                        {type === 'history'
                            ? session.custom?.title
                            : `Tip ${session.fromUserId.id === session.userId ? 'to' : 'from'} ${
                                  session.fromUserId.id === session.userId
                                      ? session.toUserId.username
                                      : session.fromUserId.username
                              }`}
                    </div>
                    <div className="text-sm text-white/60 flex items-center gap-1 mt-1">
                        <LinkIcon className="h-3 w-3" />
                        {type === 'history' ? session.callId : session.callId._id}
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
                            {session.custom?.type || '-'}
                        </span>
                    </div>
                    <div>
                        <div className="text-white/60 mb-1">Duration</div>
                        <div>{formatDuration(session.duration ?? 0)}</div>
                    </div>
                    <div className="col-span-2">
                        <div className="text-white/60 mb-1">POA Status</div>
                        {session.poa ? (
                            <POADialog poa={session.poa} />
                        ) : (
                            <span className="text-white/60">-</span>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <div className="text-white/60 mb-1">Received</div>
                        <div>
                            {session.fromUserId.id !== session.userId
                                ? `${session.amount} ${session.currency}`
                                : '0 USDC'}
                        </div>
                    </div>
                    <div>
                        <div className="text-white/60 mb-1">Sent</div>
                        <div>
                            {session.fromUserId.id === session.userId
                                ? `${session.amount} ${session.currency}`
                                : '0 USDC'}
                        </div>
                    </div>
                    <div className="col-span-2">
                        {session.transactionHash && (
                            <Button
                                variant="link"
                                className="text-white underline hover:text-white/90 p-0 h-auto"
                                onClick={() =>
                                    window.open(
                                        `https://etherscan.io/tx/${session.transactionHash}`,
                                        '_blank'
                                    )
                                }
                            >
                                View transaction
                            </Button>
                        )}
                    </div>
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
