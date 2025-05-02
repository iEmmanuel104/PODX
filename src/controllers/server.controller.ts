/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, RequestHandler } from "express";
import { WEBSITE_URL } from "../utils/constants";
import { DOCUMENTATION_URL } from "../utils/constants";
import { logger } from "../utils/logger";
import {
    CustomAPIError,
    MongoError,
    SequelizeForeignKeyConstraintError,
    SequelizeUniqueConstraintError,
    SequelizeValidationError,
    SequelizeValidationErrorItem,
    GenericErrors,
    SequelizeDatabaseError,
    HttpStatusCode,
} from "../utils/customErrors";
import { ValidationErrorItem } from "sequelize/types";

// Define the shape of the health data using an interface
interface ServerHealthData {
    serverStatus: string;
    message: string;
    documentation: string;
    client: string;
    admin: string;
}

// Function to generate the server health JSON response
export function serverHealth(data: ServerHealthData): any {
    const healthInfo = {
        status: data.serverStatus,
        message: data.message,
        documentation_url: data.documentation,
        client_url: data.client,
        admin_url: data.admin,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        uptime: process.uptime() + " seconds",
    };

    // return JSON.stringify(healthInfo, null, 2);
    return healthInfo;
}

function handleMongoDBErrors(
    err: MongoError,
): { message: string; statusCode: number } | null {
    if (err.name === "ValidationError" && "errors" in err) {
        const message = Object.values(err.errors as GenericErrors)
            .map((item) => (item as ValidationErrorItem).message)
            .join(",");
        return { message, statusCode: 400 };
    }

    if (err.code === 11000 && "keyValue" in err) {
        const message = `Duplicate value entered for ${Object.keys(
            err.keyValue as Record<string, unknown>,
        ).join(", ")} field(s), please choose another value`;
        return { message, statusCode: 400 };
    }

    if (err.name === "CastError" && "value" in err) {
        const message = `No item found with id: ${err.value}`;
        return { message, statusCode: 404 };
    }

    return null;
}

function handleSequelizeErrors(
    err:
        | SequelizeValidationError
        | SequelizeUniqueConstraintError
        | SequelizeForeignKeyConstraintError
        | SequelizeDatabaseError,
): { message: string; statusCode: number } | null {
    if (err.name === "SequelizeValidationError" && "errors" in err) {
        const message = Object.values(err.errors)
            .map((item: SequelizeValidationErrorItem) => item.message)
            .join(",");
        return { message, statusCode: 400 };
    }

    if (err.name === "SequelizeUniqueConstraintError" && "errors" in err) {
        const message = Object.values(err.errors)
            .map((item: SequelizeValidationErrorItem) => item.message)
            .join(",");
        return { message, statusCode: 400 };
    }

    if (err.name === "SequelizeForeignKeyConstraintError" && "parent" in err) {
        const message = err.parent.detail;
        return { message, statusCode: 400 };
    }

    if (err.name === "SequelizeDatabaseError") {
        return { message: err.message, statusCode: 400 };
    }

    return null;
}

export default class ServerController {
    static getServerHealth: RequestHandler = (
        req: Request,
        res: Response,
    ): void => {
        const data = {
            serverStatus: "success",
            message: `Welcome to PodX ${process.env.NODE_ENV} server`,
            documentation: DOCUMENTATION_URL,
            client: WEBSITE_URL,
            admin: "www.twitter.com",
        };

        const jsonResponse = serverHealth(data);
        // res.setHeader("Content-Type", "application/json");
        res.status(200).json(jsonResponse);
    };

    static errorHandler(
        err: CustomAPIError,
        req: Request,
        res: Response,
    ): Response {
        logger.error("Error occurred:", {
            message: err.message,
            stack: err.stack,
            statusCode: err.statusCode || 500,
        });

        const customError = {
            status: "error",
            error: true,
            statusCode: err.statusCode || 500,
            message: err.message || "Ops, Something went wrong",
        };

        // Handle MongoDB errors
        const mongoError = handleMongoDBErrors(err as unknown as MongoError);
        if (mongoError) {
            customError.message = mongoError.message;
            customError.statusCode = mongoError.statusCode as HttpStatusCode;
        }

        // Handle Sequelize errors
        const sequelizeError = handleSequelizeErrors(
            err as unknown as SequelizeValidationError,
        );
        if (sequelizeError) {
            customError.message = sequelizeError.message;
            customError.statusCode =
                sequelizeError.statusCode as HttpStatusCode;
        }

        // Default case for general errors
        // if (customError.statusCode === 500) {
        //     return res.status(500).json({
        //         status: "error",
        //         error: true,
        //         message: "Ops, Something went wrong",
        //     });
        // }

        res.setHeader("Content-Type", "application/json");
        return res.status(customError.statusCode).json(customError);
    }

    static notFound(req: Request, res: Response): Response {
        res.setHeader("Content-Type", "application/json");
        return res.status(404).json({
            status: "error",
            error: true,
            message: "Route does not Exist",
        });
    }
}
