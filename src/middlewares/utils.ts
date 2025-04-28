// This file contains utility functions for wrapping request handlers in Express.js.
// It includes a function to handle async controllers and a function to handle async middlewares.

import { Request, Response, NextFunction } from "express";
import {
    AsyncController,
    AuthenticatedAsyncController,
    AuthenticatedRequest,
} from "./types";

export const AuthAsyncToSyncController = (
    controller: AuthenticatedAsyncController,
) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        controller(req as unknown as AuthenticatedRequest, res, next)
            // .then((result) => next(result))
            .catch((error) => {
                next(error);
            });
    };
};

export const AsyncToSyncController = (controller: AsyncController) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        controller(req as unknown as AuthenticatedRequest, res, next)
            // .then((result) => next(result))
            .catch((error) => {
                next(error);
            });
    };
};
