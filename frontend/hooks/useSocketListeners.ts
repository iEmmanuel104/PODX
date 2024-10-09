import { useEffect } from 'react';
import { getSocket } from '../lib/connections/socket';
import { useAppDispatch } from '../store/hooks';
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
} from '../store/slices/podSlice';
import { handleSignal } from '../lib/connections/webrtc';

export const useSocketListeners = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        let socket;
        try {
            socket = getSocket();
        } catch (error) {
            console.log('Socket not initialized yet');
            return;
        }

        socket.on('user-joined', ({ userId, socketId }) => {
            dispatch(addParticipant({ userId, socketId }));
        });

        socket.on('user-left', ({ userId }) => {
            dispatch(removeParticipant(userId));
        });

        socket.on('pod-type-changed', ({ podId, newType, admittedUsers }) => {
            dispatch(setPodType(newType));
            if (admittedUsers) {
                admittedUsers.forEach((userId: string) => dispatch(addParticipant({ userId, socketId: 'unknown' })));
            }
        });

        socket.on('content-updated', ({ podId, newIpfsContentHash }) => {
            dispatch(updatePodContent({ podId, newIpfsContentHash }));
        });

        socket.on('co-host-approved', ({ approvedUserId, podId }) => {
            // Update UI to reflect new co-host status
            console.log(`User ${approvedUserId} is now a co-host for pod ${podId}`);
        });

        socket.on('join-request-approved', ({ approvedUserId, podId }) => {
            dispatch(addParticipant({ userId: approvedUserId, socketId: 'unknown' }));
        });

        socket.on('all-join-requests-approved', ({ podId, approvedUsers }) => {
            approvedUsers.forEach((userId: string) => dispatch(addParticipant({ userId, socketId: 'unknown' })));
        });

        socket.on('new-message', ({ userId, message }) => {
            dispatch(addMessage({ userId, message }));
        });

        socket.on('user-audio-toggle', ({ userId, isAudioEnabled }) => {
            dispatch(updateParticipantAudioState({ userId, isAudioEnabled }));
        });

        socket.on('user-video-toggle', ({ userId, isVideoEnabled }) => {
            dispatch(updateParticipantVideoState({ userId, isVideoEnabled }));
        });

        socket.on('user-muted', ({ userId, muteType, isMuted }) => {
            if (muteType === 'audio') {
                dispatch(updateParticipantAudioState({ userId, isAudioEnabled: !isMuted }));
            } else {
                dispatch(updateParticipantVideoState({ userId, isVideoEnabled: !isMuted }));
            }
        });

        socket.on('all-users-muted', ({ muteType, isMuted }) => {
            // Update all participants' mute state
            console.log(`All users ${muteType} ${isMuted ? 'muted' : 'unmuted'}`);
        });

        socket.on('pod-stats-updated', (stats) => {
            dispatch(updatePodStats(stats));
        });

        socket.on('pod-owner-changed', ({ podId, newOwnerId }) => {
            // Update UI to reflect new owner
            console.log(`New owner for pod ${podId}: ${newOwnerId}`);
        });

        socket.on('tip-sent', ({ from, to, amount, transactionHash }) => {
            // Update UI to show tip transaction
            console.log(`Tip sent from ${from} to ${to}, amount: ${amount}, tx: ${transactionHash}`);
        });

        socket.on('tip-failed', ({ error }) => {
            console.error('Tip failed:', error);
        });

        socket.on('signal', ({ from, signal }) => {
            handleSignal(from, signal);
        });

        socket.on('co-host-requested', ({ userId, podId }) => {
            dispatch(addCoHostRequest({ userId, podId }));
        });

        socket.on('users-admitted', ({ podId, admittedUsers }) => {
            admittedUsers.forEach((userId: string) => {
                dispatch(addParticipant({ userId, socketId: 'unknown' }));
                dispatch(removeJoinRequest({ userId, podId }));
            });
        });

        socket.on('mute-failed', ({ error }) => {
            dispatch(setError({ type: 'mute', message: error }));
        });

        socket.on('mute-all-failed', ({ error }) => {
            dispatch(setError({ type: 'muteAll', message: error }));
        });

        socket.on('tip-pending', ({ transactionHash }) => {
            // Update UI to show pending transaction
            console.log(`Tip transaction pending: ${transactionHash}`);
        });


        return () => {
            socket.off('user-joined');
            socket.off('user-left');
            socket.off('pod-type-changed');
            socket.off('content-updated');
            socket.off('co-host-approved');
            socket.off('join-request-approved');
            socket.off('all-join-requests-approved');
            socket.off('new-message');
            socket.off('user-audio-toggle');
            socket.off('user-video-toggle');
            socket.off('user-muted');
            socket.off('all-users-muted');
            socket.off('pod-stats-updated');
            socket.off('pod-owner-changed');
            socket.off('tip-sent');
            socket.off('tip-failed');
            socket.off('signal');
            socket.off('co-host-requested');
            socket.off('users-admitted');
            socket.off('mute-failed');
            socket.off('mute-all-failed');
            socket.off('tip-pending');
        };
    }, [dispatch]);
};