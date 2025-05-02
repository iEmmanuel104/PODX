import { Request, Response, NextFunction } from "express";
import { UnauthorizedError, ForbiddenError } from "../utils/customErrors";
import { IUser } from "../models/Mongodb/user.model";
import UserService from "../services/user.service";
import { AuthUtil } from "../utils/token";
import { logger } from "../utils/logger";

export interface AuthenticatedRequest extends Request {
    user: IUser;
}

async function authenticateUser(token: string): Promise<IUser> {
    const decoded = AuthUtil.verifyTokenWithHash(token);

    const user = await UserService.viewSingleUserByWalletAddressWithoutStreak(
        decoded.user.walletAddress,
    );

    if (!user || !user.walletAddress) {
        throw new UnauthorizedError("Invalid user");
    }

    if (user.settings?.isBlocked) {
        throw new ForbiddenError("Account blocked. Please contact support");
    }

    if (user.settings?.isDeactivated) {
        throw new ForbiddenError("Account deactivated. Please contact support");
    }

    return user;
}

function logAuthError(error: Error, req: Request): void {
    logger.error("Authentication Error", {
        message: error.message,
        path: req.path,
        method: req.method,
        headers: req.headers,
    });
}

function extractToken(req: Request): string {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        throw new UnauthorizedError("Missing or invalid authorization header");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        throw new UnauthorizedError("Missing token");
    }

    return token;
}

export const basicAuth = function () {
    return (req: Request, res: Response, next: NextFunction): void => {
        const token = extractToken(req);

        authenticateUser(token)
            .then((user) => {
                (req as AuthenticatedRequest).user = user;
                next();
            })
            .catch((error) => {
                logAuthError(error, req);
                next(error);
            });
    };
};
