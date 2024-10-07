import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import { logger } from '../utils/logger';
import socketAuthAccess, { AuthenticatedSocket } from './middlewares/socketAuthAccess';
import attachPodHandlers from './controllers/podHandler';
import attachTipHandlers from './controllers/tipHandler';
import attachMediaHandlers from './controllers/mediaHandler';
import { PodManager } from './socket-helper/podManager';
import corsOptions from '../utils/cors';
import { redisClient } from '../utils/redis';
import Redis from 'ioredis';
import { handleRedisMessage } from './middlewares/handleRedisMessage';


export let io: SocketIOServer;
let redisPubClient: Redis;
let redisSubClient: Redis;
const podManager = new PodManager();

export function initializeSocketIO(server: Server): void {
    // Create Redis pub/sub clients
    redisPubClient = redisClient.duplicate();
    redisSubClient = redisClient.duplicate();

    io = new SocketIOServer(server, {
        cors: corsOptions,
        connectionStateRecovery: {},
        adapter: createAdapter(redisPubClient, redisSubClient),
    });

    // Apply authentication middleware
    io.use(socketAuthAccess);

    // Set up Redis subscription
    redisSubClient.subscribe('pod-updates');
    redisSubClient.on('message', (channel: string, message: string) => {
        const data = JSON.parse(message);
        handleRedisMessage(io, data);
    });

    io.on('connection', (socket: Socket) => {
        const authenticatedSocket = socket as AuthenticatedSocket;
        const userId = authenticatedSocket.userId;
        logger.info(`New WebSocket connection: ${socket.id} for user: ${userId}`);

        // Attach handlers
        attachPodHandlers(io, authenticatedSocket, podManager);
        attachTipHandlers(io, authenticatedSocket);
        attachMediaHandlers(io, authenticatedSocket, podManager);

        // Handle disconnection
        socket.on('disconnect', async () => {
            const userPods = await podManager.getUserPods(userId);

            for (const podId of userPods) {
                const updatedPod = await podManager.leavePod(podId, userId);
                if (updatedPod) {
                    io.to(podId).emit('user-left', { userId, socketId: socket.id });
                    io.to(podId).emit('pod-stats-updated', updatedPod.stats);
                    if (updatedPod.owner.toString() !== userId && updatedPod.owner.toString() !== authenticatedSocket.user.id) {
                        io.to(podId).emit('pod-owner-changed', { podId, newOwnerId: updatedPod.owner.toString() });
                    }
                    logger.info(`User ${userId} disconnected from pod ${podId}`);
                }
            }

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

export function getRedisPubClient(): Redis {
    if (!redisPubClient) {
        throw new Error('Redis pub client not initialized!');
    }
    return redisPubClient;
}

export function getRedisSubClient(): Redis {
    if (!redisSubClient) {
        throw new Error('Redis sub client not initialized!');
    }
    return redisSubClient;
}