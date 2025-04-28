import { DecodedTokenData, ENCRYPTEDTOKEN } from "../utils/interface";
import { Request, Response, NextFunction } from "express";
import { UnauthorizedError, ForbiddenError } from "../utils/customErrors";
import { IUser } from "../models/Mongodb/user.model";
import UserService from "../services/user.service";
import { logger } from "../utils/logger";
import { AuthUtil } from "../utils/token";
import { IAdmin } from "../models/Mongodb/admin.model";
import { ADMIN_EMAIL } from "../utils/constants";
import AdminService from "../services/AdminServices/admin.service";
import { AuthenticatedAsyncController } from "./types";

export interface AuthenticatedRequest extends Request {
    user: IUser;
}

export interface AdminAuthenticatedRequest extends Request {
    isSuperAdmin: boolean;
    email: string;
    admin: IAdmin;
}

// export function AuthenticatedController<T = AuthenticatedRequest>(
//     controller: AuthenticatedAsyncController<T>,
// ) {
//     return (req: Request, res: Response, next: NextFunction) => {
//         controller(req as T, res, next);
//         return;
//     };
// }

export function AdminAuthenticatedController<T = AdminAuthenticatedRequest>(
    controller: AuthenticatedAsyncController<T>,
) {
    return async (req: Request, res: Response, next: NextFunction) => {
        return controller(req as T, res, next);
    };
}

export async function authenticateUser(token: string): Promise<IUser> {
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

export const basicAuth = function () {
    return (req: Request, res: Response, next: NextFunction): void => {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            next(
                new UnauthorizedError(
                    "Missing or invalid authorization header",
                ),
            );
            return;
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            next(new UnauthorizedError("Missing token"));
            return;
        }

        authenticateUser(token)
            .then((user) => {
                (req as AuthenticatedRequest).user = user;
                next();
            })
            .catch((error) => {
                next(error);
            });
    };
};

export const adminAuth = function (tokenType: ENCRYPTEDTOKEN) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer"))
            return next(new UnauthorizedError("Invalid authorization header"));

        const jwtToken = authHeader.split(" ")[1];

        const payload = AuthUtil.verifyAdminToken(jwtToken, tokenType);

        const tokenData = payload as unknown as Omit<DecodedTokenData, "user">;
        logger.payload("Admin Token data", tokenData);

        if (tokenData.tokenType !== "admin") {
            return next(
                new UnauthorizedError(
                    "You are not authorized to perform this action",
                ),
            );
        }

        // const key = `${tokenType}_token:${tokenData.authKey}`;
        // const token = await TokenCacheUtil.getTokenFromCache(key);

        // if (token !== jwtToken) {
        //     return next(new UnauthorizedError('You are not authorized to perform this action'));
        // }

        let emailToUse = (tokenData.authKey as string).toLowerCase().trim();
        if ((tokenData.authKey as string) !== ADMIN_EMAIL) {
            const admin = await AdminService.getAdminByEmail(
                tokenData.authKey as string,
            );
            emailToUse = admin.email;
            (req as AdminAuthenticatedRequest).admin = admin;
            (req as AdminAuthenticatedRequest).isSuperAdmin =
                admin.isSuperAdmin ?? false;
        } else {
            (req as AdminAuthenticatedRequest).isSuperAdmin = true;
        }

        (req as AdminAuthenticatedRequest).email = emailToUse;

        logger.authorized("User authorized");

        next();
    };
};

// Add custom middleware to allow optional authentication
export const optionalAuth = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    // check if the request has an authorization header and it is not an iAdmin request
    if (
        req.headers.authorization &&
        !req.headers["x-iadmin-access"] &&
        req.headers["x-iadmin-access"] !== "true"
    ) {
        return basicAuth()(req, res, next);
    }
    return next();
};
