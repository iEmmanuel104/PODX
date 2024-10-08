import { useCallback } from 'react';
import { getSocket } from '../lib/connections/socket';
import { useAppDispatch } from '../store/hooks';
import { setPodId, addParticipant, removeParticipant, toggleAudio, toggleVideo, addMessage, setPodType } from '../store/slices/podSlice';

export const useSocketEmitters = () => {
    const dispatch = useAppDispatch();
    const socket = getSocket();

    const createPod = useCallback((ipfsContentHash: string) => {
        return new Promise<string>((resolve, reject) => {
            socket.emit('create-pod', ipfsContentHash, (response: { success: boolean; podId?: string; error?: string }) => {
                if (response.success && response.podId) {
                    dispatch(setPodId(response.podId));
                    resolve(response.podId);
                } else {
                    reject(new Error(response.error || 'Failed to create pod'));
                }
            });
        });
    }, [socket, dispatch]);

    const joinPod = useCallback((podId: string) => {
        return new Promise<void>((resolve, reject) => {
            socket.emit('join-pod', podId, (response: { success: boolean; status?: 'joined' | 'requested'; error?: string }) => {
                if (response.success) {
                    dispatch(setPodId(podId));
                    if (response.status === 'joined') {
                        resolve();
                    } else {
                        reject(new Error('Join request sent'));
                    }
                } else {
                    reject(new Error(response.error || 'Failed to join pod'));
                }
            });
        });
    }, [socket, dispatch]);

    const leavePod = useCallback((podId: string) => {
        return new Promise<void>((resolve, reject) => {
            socket.emit('leave-pod', podId, (response: { success: boolean; error?: string }) => {
                if (response.success) {
                    dispatch(setPodId(null));
                    resolve();
                } else {
                    reject(new Error(response.error || 'Failed to leave pod'));
                }
            });
        });
    }, [socket, dispatch]);

    const getPodInfo = useCallback((podId: string) => {
        return new Promise((resolve, reject) => {
            socket.emit('get-pod-info', podId, (response: { success: boolean; pod?: any; error?: string }) => {
                if (response.success && response.pod) {
                    resolve(response.pod);
                } else {
                    reject(new Error(response.error || 'Failed to get pod info'));
                }
            });
        });
    }, [socket]);

    const getPodMembers = useCallback((podId: string) => {
        return new Promise((resolve, reject) => {
            socket.emit('get-pod-members', podId, (response: { success: boolean; members?: any[]; error?: string }) => {
                if (response.success && response.members) {
                    resolve(response.members);
                } else {
                    reject(new Error(response.error || 'Failed to get pod members'));
                }
            });
        });
    }, [socket]);

    const getJoinRequests = useCallback((podId: string) => {
        return new Promise((resolve, reject) => {
            socket.emit('get-join-requests', podId, (response: { success: boolean; requests?: string[]; error?: string }) => {
                if (response.success && response.requests) {
                    resolve(response.requests);
                } else {
                    reject(new Error(response.error || 'Failed to get join requests'));
                }
            });
        });
    }, [socket]);

    const getCoHostRequests = useCallback((podId: string) => {
        return new Promise((resolve, reject) => {
            socket.emit('get-co-host-requests', podId, (response: { success: boolean; requests?: string[]; error?: string }) => {
                if (response.success && response.requests) {
                    resolve(response.requests);
                } else {
                    reject(new Error(response.error || 'Failed to get co-host requests'));
                }
            });
        });
    }, [socket]);

    const updateContent = useCallback((podId: string, newIpfsContentHash: string) => {
        return new Promise<void>((resolve, reject) => {
            socket.emit('update-content', podId, newIpfsContentHash, (response: { success: boolean; error?: string }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new Error(response.error || 'Failed to update content'));
                }
            });
        });
    }, [socket]);

    const requestCoHost = useCallback((podId: string) => {
        return new Promise<void>((resolve, reject) => {
            socket.emit('request-co-host', podId, (response: { success: boolean; error?: string }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new Error(response.error || 'Failed to request co-host'));
                }
            });
        });
    }, [socket]);

    const approveCoHost = useCallback((podId: string, coHostUserId: string) => {
        return new Promise<void>((resolve, reject) => {
            socket.emit('approve-co-host', podId, coHostUserId, (response: { success: boolean; error?: string }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new Error(response.error || 'Failed to approve co-host'));
                }
            });
        });
    }, [socket]);

    const changePodType = useCallback((podId: string, newType: 'open' | 'trusted') => {
        return new Promise<string[]>((resolve, reject) => {
            socket.emit('change-pod-type', podId, newType, (response: { success: boolean; admittedUsers?: string[]; error?: string }) => {
                if (response.success) {
                    dispatch(setPodType(newType));
                    resolve(response.admittedUsers || []);
                } else {
                    reject(new Error(response.error || 'Failed to change pod type'));
                }
            });
        });
    }, [socket, dispatch]);

    const approveJoinRequest = useCallback((podId: string, joinUserId: string) => {
        return new Promise<void>((resolve, reject) => {
            socket.emit('approve-join-request', podId, joinUserId, (response: { success: boolean; error?: string }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new Error(response.error || 'Failed to approve join request'));
                }
            });
        });
    }, [socket]);

    const approveAllJoinRequests = useCallback((podId: string) => {
        return new Promise<string[]>((resolve, reject) => {
            socket.emit('approve-all-join-requests', podId, (response: { success: boolean; approvedUsers?: string[]; error?: string }) => {
                if (response.success) {
                    resolve(response.approvedUsers || []);
                } else {
                    reject(new Error(response.error || 'Failed to approve all join requests'));
                }
            });
        });
    }, [socket]);

    const sendMessage = useCallback((podId: string, message: string) => {
        socket.emit('send-message', { podId, message });
        dispatch(addMessage({ userId: socket.id || 'unknown', message }));
    }, [socket, dispatch]);

    const toggleAudioEmit = useCallback((podId: string, isAudioEnabled: boolean) => {
        socket.emit('toggle-audio', { podId, isAudioEnabled });
        dispatch(toggleAudio());
    }, [socket, dispatch]);

    const toggleVideoEmit = useCallback((podId: string, isVideoEnabled: boolean) => {
        socket.emit('toggle-video', { podId, isVideoEnabled });
        dispatch(toggleVideo());
    }, [socket, dispatch]);

    const muteUser = useCallback((podId: string, targetUserId: string, muteType: 'audio' | 'video', isMuted: boolean) => {
        socket.emit('mute-user', { podId, targetUserId, muteType, isMuted });
    }, [socket]);

    const muteAllUsers = useCallback((podId: string, muteType: 'audio' | 'video', isMuted: boolean) => {
        socket.emit('mute-all', { podId, muteType, isMuted });
    }, [socket]);

    const sendTip = useCallback((podId: string, recipientId: string, amount: string) => {
        return new Promise<string>((resolve, reject) => {
            socket.emit('send-tip', podId, recipientId, amount, (response: { success: boolean; transactionHash?: string; error?: string }) => {
                if (response.success && response.transactionHash) {
                    resolve(response.transactionHash);
                } else {
                    reject(new Error(response.error || 'Failed to send tip'));
                }
            });
        });
    }, [socket]);

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
        toggleAudioEmit,
        toggleVideoEmit,
        muteUser,
        muteAllUsers,
        sendTip,
    };
};