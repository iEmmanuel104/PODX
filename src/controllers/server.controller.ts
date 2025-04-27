import { Request, Response, RequestHandler } from "express";
import { WEBSITE_URL } from "../utils/constants";
import { DOCUMENTATION_URL } from "../utils/constants";
import { logger } from "../utils/logger";
import {
    CustomAPIError,
    MongoDBCastError,
    MongoError,
    SequelizeForeignKeyConstraintError,
    SequelizeUniqueConstraintError,
    SequelizeValidationError,
    SequelizeValidationErrorItem,
    GenericErrors,
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
export function serverHealth(data: ServerHealthData): string {
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

    return JSON.stringify(healthInfo, null, 2);
}

export default class ServerController {
    static getServerHealth: RequestHandler = (req: Request, res: Response): void => {
        const data = {
            serverStatus: "success",
            message: `Welcome to PodX ${process.env.NODE_ENV} server`,
            documentation: DOCUMENTATION_URL,
            client: WEBSITE_URL,
            admin: "www.twitter.com",
        };

        const jsonResponse = serverHealth(data);
        res.setHeader("Content-Type", "application/json");
        res.send(jsonResponse);
    };

    static errorHandler(err: CustomAPIError, req: Request, res: Response): Response {
        logger.error("Error handler");
        logger.error(err);

        const customError = {
            status: "error",
            error: true,
            statusCode: err.statusCode || 500,
            message: err.message || "Ops, Something went wrong",
        };

        // MongoDB ValidationError
        if (err.name === "ValidationError" && "errors" in err) {
            customError.message = Object.values(err.errors as GenericErrors)
                .map((item) => (item as ValidationErrorItem).message)
                .join(",");
            customError.statusCode = 400;
        }

        // MongoDB Duplicate Key Error
        if ((err as unknown as MongoError).code === 11000 && "keyValue" in err) {
            customError.message = `Duplicate value entered for ${Object.keys(err.keyValue as Record<string, unknown>).join(", ")} field(s), please choose another value`;
            customError.statusCode = 400;
        }

        // MongoDB CastError (Invalid ObjectId)
        if (err.name === "CastError" && "value" in err) {
            customError.message = `No item found with id: ${(err as MongoDBCastError).value}`;
            customError.statusCode = 404;
        }

        // Sequelize Validation Error
        if (err.name === "SequelizeValidationError" && "errors" in err) {
            customError.message = Object.values((err as SequelizeValidationError).errors)
                .map((item: SequelizeValidationErrorItem) => item.message)
                .join(",");
            customError.statusCode = 400;
        }

        // Sequelize Unique Constraint Error
        if (err.name === "SequelizeUniqueConstraintError" && "errors" in err) {
            customError.message = Object.values((err as SequelizeUniqueConstraintError).errors)
                .map((item: SequelizeValidationErrorItem) => item.message)
                .join(",");
            customError.statusCode = 400;
        }

        // Sequelize Database Error
        if (err.name === "SequelizeDatabaseError") {
            customError.message = err.message;
            customError.statusCode = 400;
        }

        // Sequelize Foreign Key Constraint Error
        if (err.name === "SequelizeForeignKeyConstraintError" && "parent" in err) {
            customError.message = (err as SequelizeForeignKeyConstraintError).parent.detail;
            customError.statusCode = 400;
        }

        // Default case for general errors
        if (customError.statusCode === 500) {
            return res.status(500).json({ status: "error", error: true, message: "Ops, Something went wrong" });
        }

        return res.status(customError.statusCode).json({
            status: customError.status,
            error: customError.error,
            message: customError.message,
        });
    }

    static notFound(req: Request, res: Response): Response {
        return res.status(404).json({
            status: "error",
            error: true,
            message: "Route does not Exist",
        });
    }
}
