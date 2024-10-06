// src/socket/middlewares/socketAuthAccess.ts
import { Socket } from 'socket.io';
import { logger } from '../../utils/logger';
import { AuthUtil } from '../../utils/token';
import UserService from '../../services/user.service';
import { UnauthorizedError, NotFoundError, ForbiddenError } from '../../utils/customErrors';
import { DecodedTokenData } from '../../utils/interface';
import { IUser } from '../../models/Mongodb/user.model';

export interface AuthenticatedSocket extends Socket {
    userId: string;
    user: IUser;
}

// eslint-disable-next-line no-unused-vars
export default async function socketAuthAccess(socket: Socket, next: (err?: Error) => void): Promise<void> {
    const header = socket.handshake.headers.authorization;

    if (!header || !header.startsWith('Bearer')) {
        return next(new Error('Invalid authorization header'));
    }

    const token = header.split(' ')[1];

    try {
        const payload = AuthUtil.decodeToken(token) as unknown as DecodedTokenData;
        if (!payload || !payload.user || !payload.user.walletAddress) {
            throw new UnauthorizedError('Invalid token');
        }

        const user = await UserService.viewSingleUser(payload.user.id);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        AuthUtil.verifyToken(token, user.walletAddress);

        if (user.settings?.isBlocked) {
            throw new ForbiddenError('Account blocked. Please contact support');
        }

        if (user.settings?.isDeactivated) {
            throw new ForbiddenError('Account deactivated. Please contact support');
        }

        (socket as AuthenticatedSocket).userId = user.id;
        (socket as AuthenticatedSocket).user = user;

        next();
    } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
    }
}