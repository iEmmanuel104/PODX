import { ClassConstructor, plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "../utils/customErrors";
import { logger } from "../utils/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validationMiddleware<T extends object>(
    type: ClassConstructor<T>,
) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const dto = plainToInstance(type, req.body);

        validate(dto)
            .then((validationErrors: ValidationError[]) => {
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
            })
            .catch((error) => {
                logger.error("Unexpected Validation Error:", error);
                next(error);
            });
    };
}

export function parseFormData(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    if (req.body) {
        // Parse boolean fields
        if (req.body.isScheduled !== undefined) {
            req.body.isScheduled = req.body.isScheduled === "true";
        }

        // Parse number fields
        if (req.body.durationRequirement !== undefined) {
            req.body.durationRequirement = parseFloat(
                req.body.durationRequirement,
            );
        }

        if (req.body.tokenGatingAddresses !== undefined) {
            req.body.tokenGatingAddresses =
                req.body.tokenGatingAddresses.split(",");
        }

        // Add more parsing logic as needed
    }
    next();
}
