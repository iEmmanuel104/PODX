"use client";

import { useEffect } from 'react';
import { useSocket } from '../lib/connections/socket';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
    addParticipant,
    removeParticipant,
    addMessage,
    setPodType,
    updatePodStats,
    updateParticipantAudioState,
    updateParticipantVideoState,
    updatePodContent,
    addCoHostRequest,
    addJoinRequest,
    removeJoinRequest,
    setError,
    setPodId,
} from '../store/slices/podSlice';
import { handleSignal } from '../lib/connections/webrtc';

export const useSocketListeners = () => {
    const dispatch = useAppDispatch();
    const [socket, isSocketConnected] = useSocket();
    const podId = useAppSelector(state => state.pod.podId);

    useEffect(() => {
        if (!isSocketConnected || !socket) return;

        const listeners = {
            'user-joined': ({ userId, socketId }: { userId: string, socketId: string }) => {
                dispatch(addParticipant({ userId, socketId }));
            },
            'user-left': ({ userId }: { userId: string }) => {
                dispatch(removeParticipant(userId));
            },
            'pod-type-changed': ({ podId, newType, admittedUsers }: { podId: string, newType: 'open' | 'trusted', admittedUsers: string[] }) => {
                dispatch(setPodType(newType));
                admittedUsers.forEach(userId => dispatch(addParticipant({ userId, socketId: 'unknown' })));
            },
            'content-updated': ({ podId, newIpfsContentHash }: { podId: string, newIpfsContentHash: string }) => {
                dispatch(updatePodContent({ podId, newIpfsContentHash }));
            },
            'co-host-approved': ({ approvedUserId, podId }: { approvedUserId: string, podId: string }) => {
                console.log(`User ${approvedUserId} is now a co-host for pod ${podId}`);
            },
            'join-request-approved': ({ approvedUserId, podId }: { approvedUserId: string, podId: string }) => {
                dispatch(addParticipant({ userId: approvedUserId, socketId: 'unknown' }));
            },
            'all-join-requests-approved': ({ podId, approvedUsers }: { podId: string, approvedUsers: string[] }) => {
                approvedUsers.forEach(userId => dispatch(addParticipant({ userId, socketId: 'unknown' })));
            },
            'new-message': ({ userId, message }: { userId: string, message: string }) => {
                dispatch(addMessage({ userId, message }));
            },
            'user-audio-toggle': ({ userId, isAudioEnabled }: { userId: string, isAudioEnabled: boolean }) => {
                dispatch(updateParticipantAudioState({ userId, isAudioEnabled }));
            },
            'user-video-toggle': ({ userId, isVideoEnabled }: { userId: string, isVideoEnabled: boolean }) => {
                dispatch(updateParticipantVideoState({ userId, isVideoEnabled }));
            },
            'user-muted': ({ userId, muteType, isMuted }: { userId: string, muteType: 'audio' | 'video', isMuted: boolean }) => {
                if (muteType === 'audio') {
                    dispatch(updateParticipantAudioState({ userId, isAudioEnabled: !isMuted }));
                } else {
                    dispatch(updateParticipantVideoState({ userId, isVideoEnabled: !isMuted }));
                }
            },
            'all-users-muted': ({ muteType, isMuted }: { muteType: 'audio' | 'video', isMuted: boolean }) => {
                console.log(`All users ${muteType} ${isMuted ? 'muted' : 'unmuted'}`);
            },
            'pod-stats-updated': (stats: any) => {
                dispatch(updatePodStats(stats));
            },
            'pod-owner-changed': ({ podId, newOwnerId }: { podId: string, newOwnerId: string }) => {
                console.log(`New owner for pod ${podId}: ${newOwnerId}`);
            },
            'tip-sent': ({ from, to, amount, transactionHash }: { from: string, to: string, amount: string, transactionHash: string }) => {
                console.log(`Tip sent from ${from} to ${to}, amount: ${amount}, tx: ${transactionHash}`);
            },
            'tip-failed': ({ error }: { error: string }) => {
                console.error('Tip failed:', error);
            },
            'signal': ({ from, signal }: { from: string, signal: any }) => {
                handleSignal(from, signal, (event: RTCTrackEvent) => {
                    // Handle the new track
                    console.log('Received new track:', event.track.kind, 'from', from);
                    // You might want to dispatch an action here to update the UI
                    // For example:
                    // dispatch(addRemoteTrack({ userId: from, track: event.track }));
                });
            },
            'co-host-requested': ({ userId, podId }: { userId: string, podId: string }) => {
                dispatch(addCoHostRequest({ userId, podId }));
            },
            'users-admitted': ({ podId, admittedUsers }: { podId: string, admittedUsers: string[] }) => {
                admittedUsers.forEach(userId => {
                    dispatch(addParticipant({ userId, socketId: 'unknown' }));
                    dispatch(removeJoinRequest({ userId, podId }));
                });
            },
            'mute-failed': ({ error }: { error: string }) => {
                dispatch(setError({ type: 'mute', message: error }));
            },
            'mute-all-failed': ({ error }: { error: string }) => {
                dispatch(setError({ type: 'muteAll', message: error }));
            },
            'tip-pending': ({ transactionHash }: { transactionHash: string }) => {
                console.log(`Tip transaction pending: ${transactionHash}`);
            },
        };

        // Attach listeners
        Object.entries(listeners).forEach(([event, handler]) => {
            socket.on(event, handler);
        });

        // Cleanup function
        return () => {
            // Detach listeners
            Object.entries(listeners).forEach(([event, handler]) => {
                socket.off(event, handler);
            });
        };
    }, [isSocketConnected, dispatch, podId]);
};