/* eslint-disable no-unused-vars */
import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../middlewares/socketAuthAccess';
import { logger } from '../../utils/logger';
import { PodManager, Pod } from '../socket-helper/podManager';

const podManager = new PodManager();

export default function attachPodHandlers(io: Server, socket: AuthenticatedSocket) {
    const userId = socket.userId;

    socket.on('create-pod', async (ipfsContentHash: string, callback: (response: { success: boolean; podId?: string; error?: string }) => void) => {
        try {
            const newPod = podManager.createPod(userId, socket.id, ipfsContentHash);
            socket.join(newPod.id);
            callback({ success: true, podId: newPod.id });
            logger.info(`User ${userId} created pod ${newPod.id}`);
        } catch (error) {
            logger.error(`Error creating pod: ${error}`);
            callback({ success: false, error: 'Failed to create pod' });
        }
    });

    socket.on('join-pod', async (podId: string, callback: (response: { success: boolean; error?: string }) => void) => {
        try {
            const updatedPod = podManager.joinPod(podId, userId, socket.id);
            if (updatedPod) {
                socket.join(podId);
                socket.to(podId).emit('user-joined', { userId, socketId: socket.id });
                io.to(podId).emit('pod-members-updated', updatedPod.members);
                callback({ success: true });
                logger.info(`User ${userId} joined pod ${podId}`);
            } else {
                throw new Error('Pod not found');
            }
        } catch (error) {
            logger.error(`Error joining pod: ${error}`);
            callback({ success: false, error: 'Failed to join pod' });
        }
    });

    socket.on('leave-pod', async (podId: string) => {
        try {
            const updatedPod = podManager.leavePod(podId, userId);
            if (updatedPod) {
                socket.leave(podId);
                socket.to(podId).emit('user-left', { userId, socketId: socket.id });
                io.to(podId).emit('pod-members-updated', updatedPod.members);
                io.to(podId).emit('pod-hosts-updated', updatedPod.hosts);
                logger.info(`User ${userId} left pod ${podId}`);
            }
        } catch (error) {
            logger.error(`Error leaving pod: ${error}`);
        }
    });

    socket.on('get-pod-info', (podId: string, callback: (response: { success: boolean; pod?: Omit<Pod, 'coHostRequests'>; error?: string }) => void) => {
        const pod = podManager.getPod(podId);
        if (pod) {
            const { coHostRequests, ...podInfo } = pod;
            console.log(coHostRequests);
            callback({ success: true, pod: podInfo });
        } else {
            callback({ success: false, error: 'Pod not found' });
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
                    io.to(podId).emit('pod-hosts-updated', pod.hosts);
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

    // Existing WebRTC and audio/video toggle handlers...
    socket.on('toggle-audio', ({ podId, isAudioEnabled }: { podId: string; isAudioEnabled: boolean }) => {
        socket.to(podId).emit('user-audio-toggle', { userId, isAudioEnabled });
    });

    socket.on('toggle-video', ({ podId, isVideoEnabled }: { podId: string; isVideoEnabled: boolean }) => {
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
        const pods = Array.from(podManager['pods'].entries());
        for (const [podId, pod] of pods) {
            if (pod.members.some(member => member.userId === userId)) {
                const updatedPod = podManager.leavePod(podId, userId);
                if (updatedPod) {
                    io.to(podId).emit('user-left', { userId, socketId: socket.id });
                    io.to(podId).emit('pod-members-updated', updatedPod.members);
                    io.to(podId).emit('pod-hosts-updated', updatedPod.hosts);
                }
            }
        }
    });
}