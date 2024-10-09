// src/socket/middlewares/socketAuthAccess.ts
import { Socket } from 'socket.io';
import { logger } from '../../utils/logger';
import { IUser } from '../../models/Mongodb/user.model';
import { authenticateUser } from '../../middlewares/authMiddleware';

export interface AuthenticatedSocket extends Socket {
    userId: string;
    user: IUser;
}

// eslint-disable-next-line no-unused-vars
export default async function socketAuthAccess(socket: Socket, next: (err?: Error) => void): Promise<void> {
    const signature = socket.handshake.auth.signature;

    if (!signature) {
        return next(new Error('Missing signature'));
    }

    try {
        const user = await authenticateUser(signature);
        (socket as AuthenticatedSocket).userId = user.id;
        (socket as AuthenticatedSocket).user = user;
        next();
    } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
    }
}