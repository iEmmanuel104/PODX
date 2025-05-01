import { plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "../utils/customErrors";
import { logger } from "../utils/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validationMiddleware(type: any) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const dto = plainToInstance(type, req.body);

        validate(dto)
            .then((validationErrors: ValidationError[]) => {
                if (validationErrors.length > 0) {
                    const errorMessages = validationErrors.map((err) =>
                        Object.values(err.constraints || {}).join(", "),
                    );
                    throw new BadRequestError(
                        "Validation failed",
                        errorMessages,
                    );
                }
                next();
            })
            .catch((error) => {
                logger.error("Validation Error:", error);
                // throw new BadRequestError("Validation failed");
                next(error);
            });
    };
}
