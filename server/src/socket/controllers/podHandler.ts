/* eslint-disable no-unused-vars */
import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../middlewares/socketAuthAccess';
import { logger } from '../../utils/logger';
import { PodManager, Pod, PodType, PodMember, JoinRequest } from '../socket-helper/podManager';


export default function attachPodHandlers(io: Server, socket: AuthenticatedSocket) {
    const userId = socket.userId;
    const user = socket.user;
    const podManager = new PodManager();

    socket.on('create-pod', async (ipfsContentHash: string, callback: (response: { success: boolean; podId?: string; error?: string }) => void) => {
        try {
            const newPod = await podManager.createPod(user, socket.id, ipfsContentHash);
            socket.join(newPod.id);
            callback({ success: true, podId: newPod.id });
            logger.info(`User ${userId} created pod ${newPod.id}`);
        } catch (error) {
            logger.error(`Error creating pod: ${error}`);
            callback({ success: false, error: 'Failed to create pod' });
        }
    });

    socket.on('join-pod', async (podId: string, callback: (response: { success: boolean; status?: 'joined' | 'requested'; error?: string }) => void) => {
        try {
            const joinStatus = await podManager.joinPod(podId, user, socket.id);
            if (joinStatus === 'joined') {
                socket.join(podId);
                const pod = podManager.getPod(podId);
                if (pod) {
                    socket.to(podId).emit('user-joined', { userId, socketId: socket.id });
                    io.to(podId).emit('pod-stats-updated', pod.stats);
                }
                callback({ success: true, status: 'joined' });
                logger.info(`User ${userId} joined pod ${podId}`);
            } else if (joinStatus === 'requested') {
                callback({ success: true, status: 'requested' });
                logger.info(`User ${userId} requested to join pod ${podId}`);
            } else {
                throw new Error('Pod not found');
            }
        } catch (error) {
            logger.error(`Error joining pod: ${error}`);
            callback({ success: false, error: 'Failed to join pod' });
        }
    });

    socket.on('leave-pod', async (podId: string, callback: (response: { success: boolean; error?: string }) => void) => {
        try {
            const updatedPod = podManager.leavePod(podId, userId);
            if (updatedPod) {
                socket.leave(podId);
                socket.to(podId).emit('user-left', { userId, socketId: socket.id });
                io.to(podId).emit('pod-stats-updated', updatedPod.stats);
                if (updatedPod.owner !== userId) {
                    io.to(podId).emit('pod-owner-changed', { podId, newOwnerId: updatedPod.owner });
                }
                callback({ success: true });
                logger.info(`User ${userId} left pod ${podId}`);
            } else {
                throw new Error('Failed to leave pod');
            }
        } catch (error) {
            logger.error(`Error leaving pod: ${error}`);
            callback({ success: false, error: 'Failed to leave pod' });
        }
    });

    socket.on('get-pod-info', (podId: string, callback: (response: { success: boolean; pod?: Pod; error?: string }) => void) => {
        const pod = podManager.getPod(podId);
        if (pod) {
            callback({ success: true, pod });
        } else {
            callback({ success: false, error: 'Pod not found' });
        }
    });

    socket.on('get-pod-members', (podId: string, callback: (response: { success: boolean; members?: PodMember[]; error?: string }) => void) => {
        const members = podManager.getPodMembers(podId);
        if (members) {
            callback({ success: true, members });
        } else {
            callback({ success: false, error: 'Pod not found' });
        }
    });

    socket.on('get-join-requests', async (podId: string, callback: (response: { success: boolean; requests?: JoinRequest[]; error?: string }) => void) => {
        try {
            const joinRequests = await podManager.getJoinRequests(podId, userId);
            if (joinRequests !== null) {
                callback({ success: true, requests: joinRequests });
                logger.info(`User ${userId} fetched join requests for pod ${podId}`);
            } else {
                throw new Error('Not authorized or pod not found');
            }
        } catch (error) {
            logger.error(`Error fetching join requests: ${error}`);
            callback({ success: false, error: 'Failed to fetch join requests' });
        }
    });

    socket.on('get-co-host-requests', async (podId: string, callback: (response: { success: boolean; requests?: PodMember[]; error?: string }) => void) => {
        try {
            const coHostRequests = await podManager.getCoHostRequests(podId, userId);
            if (coHostRequests !== null) {
                callback({ success: true, requests: coHostRequests });
                logger.info(`User ${userId} fetched co-host requests for pod ${podId}`);
            } else {
                throw new Error('Not authorized or pod not found');
            }
        } catch (error) {
            logger.error(`Error fetching co-host requests: ${error}`);
            callback({ success: false, error: 'Failed to fetch co-host requests' });
        }
    });

    socket.on('update-content', async (podId: string, newIpfsContentHash: string, callback: (response: { success: boolean; error?: string }) => void) => {
        try {
            const pod = podManager.getPod(podId);
            if (pod && (pod.owner === userId || pod.hosts.includes(userId))) {
                const success = podManager.updatePodContent(podId, newIpfsContentHash);
                if (success) {
                    io.to(podId).emit('content-updated', { podId, newIpfsContentHash });
                    callback({ success: true });
                    logger.info(`User ${userId} updated content for pod ${podId}`);
                } else {
                    throw new Error('Failed to update content');
                }
            } else {
                throw new Error('User not authorized to update content');
            }
        } catch (error) {
            logger.error(`Error updating content: ${error}`);
            callback({ success: false, error: 'Failed to update content' });
        }
    });

    socket.on('request-co-host', async (podId: string, callback: (response: { success: boolean; error?: string }) => void) => {
        try {
            const success = podManager.requestCoHost(podId, userId);
            if (success) {
                const pod = podManager.getPod(podId);
                if (pod) {
                    io.to(podId).emit('co-host-requested', { userId, podId });
                    callback({ success: true });
                    logger.info(`User ${userId} requested co-host for pod ${podId}`);
                } else {
                    throw new Error('Pod not found');
                }
            } else {
                throw new Error('Failed to request co-host');
            }
        } catch (error) {
            logger.error(`Error requesting co-host: ${error}`);
            callback({ success: false, error: 'Failed to request co-host' });
        }
    });

    socket.on('approve-co-host', async (podId: string, coHostUserId: string, callback: (response: { success: boolean; error?: string }) => void) => {
        try {
            const success = podManager.approveCoHost(podId, userId, coHostUserId);
            if (success) {
                const pod = podManager.getPod(podId);
                if (pod) {
                    io.to(podId).emit('co-host-approved', { approvedUserId: coHostUserId, podId });
                    io.to(podId).emit('pod-stats-updated', pod.stats);
                    callback({ success: true });
                    logger.info(`User ${userId} approved co-host ${coHostUserId} for pod ${podId}`);
                } else {
                    throw new Error('Pod not found');
                }
            } else {
                throw new Error('Failed to approve co-host');
            }
        } catch (error) {
            logger.error(`Error approving co-host: ${error}`);
            callback({ success: false, error: 'Failed to approve co-host' });
        }
    });

    socket.on('change-pod-type', async (podId: string, newType: PodType, callback: (response: { success: boolean; admittedUsers?: string[]; error?: string }) => void) => {
        try {
            const pod = podManager.getPod(podId);
            if (pod && pod.owner === userId) {
                const admittedUsers = podManager.changePodType(podId, userId, newType);
                io.to(podId).emit('pod-type-changed', { podId, newType });
                if (newType === 'open' && admittedUsers.length > 0) {
                    io.to(podId).emit('users-admitted', { podId, admittedUsers });
                    io.to(podId).emit('pod-stats-updated', pod.stats);
                }
                callback({ success: true, admittedUsers });
                logger.info(`User ${userId} changed pod ${podId} type to ${newType}`);
            } else {
                throw new Error('User not authorized to change pod type');
            }
        } catch (error) {
            logger.error(`Error changing pod type: ${error}`);
            callback({ success: false, error: 'Failed to change pod type' });
        }
    });

    socket.on('approve-join-request', async (podId: string, joinUserId: string, callback: (response: { success: boolean; error?: string }) => void) => {
        try {
            const success = await podManager.approveJoinRequest(podId, userId, joinUserId);
            if (success) {
                const pod = podManager.getPod(podId);
                if (pod) {
                    io.to(podId).emit('join-request-approved', { approvedUserId: joinUserId, podId });
                    io.to(podId).emit('pod-stats-updated', pod.stats);
                    callback({ success: true });
                    logger.info(`User ${userId} approved join request for ${joinUserId} in pod ${podId}`);
                } else {
                    throw new Error('Pod not found');
                }
            } else {
                throw new Error('Failed to approve join request');
            }
        } catch (error) {
            logger.error(`Error approving join request: ${error}`);
            callback({ success: false, error: 'Failed to approve join request' });
        }
    });

    socket.on('approve-all-join-requests', async (podId: string, callback: (response: { success: boolean; approvedUsers?: string[]; error?: string }) => void) => {
        try {
            const approvedUsers = await podManager.approveAllJoinRequests(podId, userId);
            if (approvedUsers.length > 0) {
                const pod = podManager.getPod(podId);
                if (pod) {
                    io.to(podId).emit('all-join-requests-approved', { podId, approvedUsers });
                    io.to(podId).emit('pod-stats-updated', pod.stats);
                    callback({ success: true, approvedUsers });
                    logger.info(`User ${userId} approved all join requests for pod ${podId}`);
                } else {
                    throw new Error('Pod not found');
                }
            } else {
                callback({ success: true, approvedUsers: [] });
                logger.info(`No join requests to approve for pod ${podId}`);
            }
        } catch (error) {
            logger.error(`Error approving all join requests: ${error}`);
            callback({ success: false, error: 'Failed to approve all join requests' });
        }
    });

    socket.on('toggle-audio', ({ podId, isAudioEnabled }: { podId: string; isAudioEnabled: boolean }) => {
        podManager.updateUserInfo(podId, userId, { isAudioEnabled });
        socket.to(podId).emit('user-audio-toggle', { userId, isAudioEnabled });
    });

    socket.on('toggle-video', ({ podId, isVideoEnabled }: { podId: string; isVideoEnabled: boolean }) => {
        podManager.updateUserInfo(podId, userId, { isVideoEnabled });
        socket.to(podId).emit('user-video-toggle', { userId, isVideoEnabled });
    });

    socket.on('send-message', ({ podId, message }: { podId: string; message: string }) => {
        socket.to(podId).emit('new-message', { userId, message });
    });

    socket.on('signal', ({ to, signal }: { to: string; signal: unknown }) => {
        io.to(to).emit('signal', { from: socket.id, signal });
        logger.info(`User ${userId} sent a signal to ${to}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const userPods = podManager.getUserPods(userId);

        userPods.forEach(podId => {
            const updatedPod = podManager.leavePod(podId, userId);
            if (updatedPod) {
                io.to(podId).emit('user-left', { userId, socketId: socket.id });
                io.to(podId).emit('pod-stats-updated', updatedPod.stats);
                if (updatedPod.owner !== userId && updatedPod.owner !== socket.user.id) {
                    io.to(podId).emit('pod-owner-changed', { podId, newOwnerId: updatedPod.owner });
                }
                logger.info(`User ${userId} disconnected from pod ${podId}`);
            }
        });

        logger.info(`WebSocket disconnected: ${socket.id} for user: ${userId}`);
    });
}