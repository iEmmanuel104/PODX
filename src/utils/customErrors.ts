type HttpStatusCode = 400 | 401 | 403 | 404 | 407 | 408 | 422 | 429 | 500 | 504;

// custom errors for API
export class CustomAPIError extends Error {
    statusCode: HttpStatusCode;
    errors?: string[];

    constructor(
        message: string,
        statusCode: HttpStatusCode,
        errors?: string[],
    ) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
    }
}

export class BadRequestError extends CustomAPIError {
    constructor(message: string, errors?: string[]) {
        super(message, 400, errors);
    }
}

export class NotFoundError extends CustomAPIError {
    constructor(message: string) {
        super(message, 404);
    }
}

export class ForbiddenError extends CustomAPIError {
    constructor(message: string) {
        super(message, 403);
    }
}

export class UnauthorizedError extends CustomAPIError {
    constructor(message: string) {
        super(message, 401);
    }
}

export class InternalServerError extends CustomAPIError {
    constructor(message: string) {
        super(message, 500);
    }
}

export class UnprocessableEntityError extends CustomAPIError {
    constructor(message: string) {
        super(message, 422);
    }
}

export class TooManyRequestsError extends CustomAPIError {
    constructor(message: string) {
        super(message, 429);
    }
}

export class GatewayTimeoutError extends CustomAPIError {
    constructor(message: string) {
        super(message, 504);
        this.statusCode = 504;
    }
}

export class TokenExpiredError extends CustomAPIError {
    constructor(message: string) {
        super(message, 401);
    }
}

export class JsonWebTokenError extends CustomAPIError {
    constructor(message: string) {
        super(message, 401);
    }
}

// Generic error for all other errors
export type GenericErrors = Record<string, unknown>;

// MongoDB Error Types
export interface ValidationErrorItem {
    message: string;
}

export interface MongoDBValidationError {
    name: "ValidationError";
    errors: Record<string, ValidationErrorItem>;
    code?: never;
    keyValue?: never;
    value?: never;
}

export interface MongoDBDuplicateError {
    name: "DuplicateError";
    code: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keyValue: Record<string, any>;
}

export interface MongoDBCastError {
    name: "CastError";
    value: string;
    code?: never;
    keyValue?: never;
    errors?: never;
}

// Sequelize Error Types
export interface SequelizeValidationErrorItem {
    message: string;
}

export interface SequelizeValidationError {
    name: "SequelizeValidationError";
    errors: Record<string, SequelizeValidationErrorItem>;
}

export interface SequelizeUniqueConstraintError {
    name: "SequelizeUniqueConstraintError";
    errors: Record<string, SequelizeValidationErrorItem>;
}

export interface SequelizeDatabaseError {
    name: "SequelizeDatabaseError";
    message: string;
}

export interface SequelizeForeignKeyConstraintError {
    name: "SequelizeForeignKeyConstraintError";
    parent: {
        detail: string;
    };
}

// Union type for all possible Sequelize Errors
export type SequelizeError =
    | SequelizeValidationError
    | SequelizeUniqueConstraintError
    | SequelizeDatabaseError
    | SequelizeForeignKeyConstraintError;

export type MongoError =
    | MongoDBValidationError
    | MongoDBDuplicateError
    | MongoDBCastError;
