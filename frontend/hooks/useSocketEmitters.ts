"use client";

import { useCallback } from 'react';
import { useSocket } from '../lib/connections/socket';
import { useAppDispatch } from '../store/hooks';
import {
    setPodId,
    addParticipant,
    removeParticipant,
    toggleLocalAudio,
    toggleLocalVideo,
    setLocalTracks,
    updateParticipantTrack,
    addMessage,
    setPodType,
    updatePodContent,
    updatePodStats,
    addCoHostRequest,
    removeCoHostRequest,
    addJoinRequest,
    removeJoinRequest,
    setError,
    setPendingTipTransaction,
    setScreenSharing,
    updateParticipantAudioState,
    updateParticipantVideoState
} from '../store/slices/podSlice';

export const useSocketEmitters = () => {
    const dispatch = useAppDispatch();
    const [socket, isSocketConnected] = useSocket();

    const emitWithSocket = useCallback((eventName: string, ...args: any[]) => {
        if (socket && isSocketConnected) {
            return new Promise((resolve, reject) => {
                socket.emit(eventName, ...args, (response: any) => {
                    if (response.success) {
                        resolve(response);
                    } else {
                        dispatch(setError({ type: eventName, message: response.error || `Failed to emit ${eventName}` }));
                        reject(new Error(response.error || `Failed to emit ${eventName}`));
                    }
                });
            });
        } else {
            const error = new Error('Socket not connected');
            dispatch(setError({ type: 'connection', message: error.message }));
            return Promise.reject(error);
        }
    }, [socket, isSocketConnected, dispatch]);

    const createPod = useCallback((ipfsContentHash: string) => {
        return emitWithSocket('create-pod', ipfsContentHash)
            .then((response: any) => {
                dispatch(setPodId(response.podId));
                dispatch(updatePodContent({ podId: response.podId, newIpfsContentHash: ipfsContentHash }));
                return response.podId;
            });
    }, [dispatch, emitWithSocket]);

    const joinPod = useCallback((podId: string) => {
        return emitWithSocket('join-pod', podId)
            .then((response: any) => {
                dispatch(setPodId(podId));
                if (response.status === 'joined') {
                    dispatch(addParticipant({ userId: socket?.id || 'unknown', socketId: socket?.id || 'unknown' }));
                    return Promise.resolve();
                } else {
                    dispatch(addJoinRequest({ userId: socket?.id || 'unknown', podId }));
                    return Promise.reject(new Error('Join request sent'));
                }
            });
    }, [dispatch, emitWithSocket, socket]);

    const leavePod = useCallback((podId: string) => {
        return emitWithSocket('leave-pod', podId)
            .then(() => {
                dispatch(setPodId(null));
                dispatch(removeParticipant(socket?.id || 'unknown'));
            });
    }, [dispatch, emitWithSocket, socket]);

    const getPodInfo = useCallback((podId: string) => {
        return emitWithSocket('get-pod-info', podId)
            .then((response: any) => {
                dispatch(updatePodStats(response.pod.stats));
                dispatch(setPodType(response.pod.type));
                dispatch(updatePodContent({ podId, newIpfsContentHash: response.pod.ipfsContentHash }));
                return response.pod;
            });
    }, [dispatch, emitWithSocket]);

    const getPodMembers = useCallback((podId: string) => {
        return emitWithSocket('get-pod-members', podId)
            .then((response: any) => {
                response.members.forEach((member: any) => {
                    dispatch(addParticipant({ userId: member.userId, socketId: member.socketId }));
                });
                return response.members;
            });
    }, [dispatch, emitWithSocket]);

    const getJoinRequests = useCallback((podId: string) => {
        return emitWithSocket('get-join-requests', podId)
            .then((response: any) => {
                response.requests.forEach((request: string) => {
                    dispatch(addJoinRequest({ userId: request, podId }));
                });
                return response.requests;
            });
    }, [dispatch, emitWithSocket]);

    const getCoHostRequests = useCallback((podId: string) => {
        return emitWithSocket('get-co-host-requests', podId)
            .then((response: any) => {
                response.requests.forEach((request: string) => {
                    dispatch(addCoHostRequest({ userId: request, podId }));
                });
                return response.requests;
            });
    }, [dispatch, emitWithSocket]);

    const updateContent = useCallback((podId: string, newIpfsContentHash: string) => {
        return emitWithSocket('update-content', podId, newIpfsContentHash)
            .then(() => {
                dispatch(updatePodContent({ podId, newIpfsContentHash }));
            });
    }, [dispatch, emitWithSocket]);

    const requestCoHost = useCallback((podId: string) => {
        return emitWithSocket('request-co-host', podId)
            .then(() => {
                dispatch(addCoHostRequest({ userId: socket?.id || 'unknown', podId }));
            });
    }, [dispatch, emitWithSocket, socket]);

    const approveCoHost = useCallback((podId: string, coHostUserId: string) => {
        return emitWithSocket('approve-co-host', podId, coHostUserId)
            .then(() => {
                dispatch(removeCoHostRequest({ userId: coHostUserId, podId }));
            });
    }, [dispatch, emitWithSocket]);

    const changePodType = useCallback((podId: string, newType: 'open' | 'trusted') => {
        return emitWithSocket('change-pod-type', podId, newType)
            .then((response: any) => {
                dispatch(setPodType(newType));
                response.admittedUsers.forEach((userId: string) => {
                    dispatch(addParticipant({ userId, socketId: 'unknown' }));
                    dispatch(removeJoinRequest({ userId, podId }));
                });
                return response.admittedUsers || [];
            });
    }, [dispatch, emitWithSocket]);

    const approveJoinRequest = useCallback((podId: string, joinUserId: string) => {
        return emitWithSocket('approve-join-request', podId, joinUserId)
            .then(() => {
                dispatch(removeJoinRequest({ userId: joinUserId, podId }));
                dispatch(addParticipant({ userId: joinUserId, socketId: 'unknown' }));
            });
    }, [dispatch, emitWithSocket]);

    const approveAllJoinRequests = useCallback((podId: string) => {
        return emitWithSocket('approve-all-join-requests', podId)
            .then((response: any) => {
                response.approvedUsers.forEach((userId: string) => {
                    dispatch(removeJoinRequest({ userId, podId }));
                    dispatch(addParticipant({ userId, socketId: 'unknown' }));
                });
                return response.approvedUsers || [];
            });
    }, [dispatch, emitWithSocket]);

    const sendMessage = useCallback((podId: string, message: string) => {
        return emitWithSocket('send-message', { podId, message })
            .then(() => {
                dispatch(addMessage({ userId: socket?.id || 'unknown', message }));
            });
    }, [dispatch, emitWithSocket, socket]);

    const toggleLocalAudioEmit = useCallback((podId: string, isAudioEnabled: boolean) => {
        return emitWithSocket('toggle-audio', { podId, isAudioEnabled })
            .then(() => {
                dispatch(toggleLocalAudio());
            });
    }, [dispatch, emitWithSocket]);

    const toggleLocalVideoEmit = useCallback((podId: string, isVideoEnabled: boolean) => {
        return emitWithSocket('toggle-video', { podId, isVideoEnabled })
            .then(() => {
                dispatch(toggleLocalVideo());
            });
    }, [dispatch, emitWithSocket]);

    const updateLocalTracks = useCallback((podId: string, audioTrackId: string | null, videoTrackId: string | null) => {
        return emitWithSocket('update-local-tracks', podId, audioTrackId, videoTrackId)
            .then(() => {
                dispatch(setLocalTracks({ audioTrackId, videoTrackId }));
            });
    }, [dispatch, emitWithSocket]);

    const updateRemoteTrack = useCallback((userId: string, kind: 'audio' | 'video', trackId: string | null) => {
        dispatch(updateParticipantTrack({ userId, kind, trackId }));
    }, [dispatch]);

    const muteUser = useCallback((podId: string, targetUserId: string, muteType: 'audio' | 'video', isMuted: boolean) => {
        return emitWithSocket('mute-user', { podId, targetUserId, muteType, isMuted })
            .then(() => {
                if (muteType === 'audio') {
                    dispatch(updateParticipantAudioState({ userId: targetUserId, isAudioEnabled: !isMuted }));
                } else {
                    dispatch(updateParticipantVideoState({ userId: targetUserId, isVideoEnabled: !isMuted }));
                }
            });
    }, [dispatch, emitWithSocket]);

    const muteAllUsers = useCallback((podId: string, muteType: 'audio' | 'video', isMuted: boolean) => {
        return emitWithSocket('mute-all', { podId, muteType, isMuted });
    }, [emitWithSocket]);

    const sendTip = useCallback((podId: string, recipientId: string, amount: string) => {
        return emitWithSocket('send-tip', podId, recipientId, amount)
            .then((response: any) => {
                dispatch(setPendingTipTransaction(response.transactionHash));
                return response.transactionHash;
            });
    }, [dispatch, emitWithSocket]);

    const toggleScreenSharing = useCallback((podId: string, isScreenSharing: boolean) => {
        return emitWithSocket('toggle-screen-sharing', { podId, isScreenSharing })
            .then(() => {
                dispatch(setScreenSharing({ isScreenSharing, userId: socket?.id || null }));
            });
    }, [dispatch, emitWithSocket, socket]);

    return {
        createPod,
        joinPod,
        leavePod,
        getPodInfo,
        getPodMembers,
        getJoinRequests,
        getCoHostRequests,
        updateContent,
        requestCoHost,
        approveCoHost,
        changePodType,
        approveJoinRequest,
        approveAllJoinRequests,
        sendMessage,
        toggleLocalAudioEmit,
        toggleLocalVideoEmit,
        updateLocalTracks,
        updateRemoteTrack,
        muteUser,
        muteAllUsers,
        sendTip,
        toggleScreenSharing,
    };
};