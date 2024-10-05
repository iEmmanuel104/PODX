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
                logger.info(`User ${userId} left pod ${podId}`);
            }
        } catch (error) {
            logger.error(`Error leaving pod: ${error}`);
        }
    });

    socket.on('get-pod-members', (podId: string, callback: (response: { success: boolean; members?: Pod['members']; error?: string }) => void) => {
        const pod = podManager.getPod(podId);
        if (pod) {
            callback({ success: true, members: pod.members });
        } else {
            callback({ success: false, error: 'Pod not found' });
        }
    });

    socket.on('update-content', async (podId: string, newIpfsContentHash: string, callback: (response: { success: boolean; error?: string }) => void) => {
        try {
            const success = podManager.updatePodContent(podId, newIpfsContentHash);
            if (success) {
                io.to(podId).emit('content-updated', { podId, newIpfsContentHash });
                callback({ success: true });
                logger.info(`User ${userId} updated content for pod ${podId}`);
            } else {
                throw new Error('Pod not found');
            }
        } catch (error) {
            logger.error(`Error updating content: ${error}`);
            callback({ success: false, error: 'Failed to update content' });
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
                }
            }
        }
    });
}