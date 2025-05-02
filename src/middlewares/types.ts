import { NextFunction, Response, Request } from "express";
import { IUser } from "../models/Mongodb/user.model";

export interface AuthenticatedRequest extends Request {
    user: IUser;
}

export type AsyncController<T = Request> = (
    req: T,
    res: Response,
    next: NextFunction,
) => Promise<void>;

export type AuthenticatedAsyncController<T = AuthenticatedRequest> =
    AsyncController<T>;
