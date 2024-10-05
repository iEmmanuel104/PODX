type HttpStatusCode = 400 | 401 | 403 | 404 | 407 | 408 | 422 | 429 | 500 | 504;

// custom errors for API
export class CustomAPIError extends Error {
    statusCode: HttpStatusCode;

    constructor(message: string, statusCode: HttpStatusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

export class BadRequestError extends CustomAPIError {
    constructor(message: string) {
        super(message, 400);
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
