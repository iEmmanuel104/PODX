import { ClassConstructor, plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "../utils/customErrors";
import { logger } from "../utils/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validationMiddleware<T extends object>(
    type: ClassConstructor<T>,
) {
    return async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const dto = plainToInstance(type, req.body);
            const validationErrors: ValidationError[] = await validate(dto);

            if (validationErrors.length > 0) {
                const errorMessages = validationErrors.flatMap((err) =>
                    Object.values(err.constraints || {}).concat(
                        (err.children || []).flatMap((child) =>
                            Object.values(child.constraints || {}),
                        ),
                    ),
                );

                logger.error("Validation Error:", {
                    errors: errorMessages,
                    requestBody: req.body,
                });

                return next(
                    new BadRequestError("Validation failed", errorMessages),
                );
            }

            next();
        } catch (error) {
            logger.error("Unexpected Validation Error:", error);
            next(error);
        }
    };
}
