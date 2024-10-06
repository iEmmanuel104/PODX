import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server } from 'http';
import { logger } from '../utils/logger';
import socketAuthAccess, { AuthenticatedSocket } from './middlewares/socketAuthAccess';
import attachPodHandlers from './controllers/podHandler';
import attachTipHandlers from './controllers/tipHandler';
import attachMediaHandlers from './controllers/mediaHandler';
import { PodManager } from './socket-helper/podManager';
import corsOptions from '../utils/cors';

let io: SocketIOServer;
const podManager = new PodManager();

export function initializeSocketIO(server: Server): void {
    io = new SocketIOServer(server, {
        cors: corsOptions,
        connectionStateRecovery: {},
    });

    // Apply authentication middleware
    io.use(socketAuthAccess);

    io.on('connection', (socket: Socket) => {
        const authenticatedSocket = socket as AuthenticatedSocket;
        const userId = authenticatedSocket.userId;
        logger.info(`New WebSocket connection: ${socket.id} for user: ${userId}`);

        // Attach handlers
        attachPodHandlers(io, authenticatedSocket, podManager);
        attachTipHandlers(io, authenticatedSocket);
        attachMediaHandlers(io, authenticatedSocket, podManager);

        // Handle disconnection
        socket.on('disconnect', () => {
            const userPods = podManager.getUserPods(userId);

            userPods.forEach(podId => {
                const updatedPod = podManager.leavePod(podId, userId);
                if (updatedPod) {
                    io.to(podId).emit('user-left', { userId, socketId: socket.id });
                    io.to(podId).emit('pod-stats-updated', updatedPod.stats);
                    if (updatedPod.owner !== userId && updatedPod.owner !== authenticatedSocket.user.id) {
                        io.to(podId).emit('pod-owner-changed', { podId, newOwnerId: updatedPod.owner });
                    }
                    logger.info(`User ${userId} disconnected from pod ${podId}`);
                }
            });

            logger.info(`WebSocket disconnected: ${socket.id} for user: ${userId}`);
        });
    });
}

export function getIO(): SocketIOServer {
    if (!io) {
        throw new Error('Socket.IO not initialized!');
    }
    return io;
}