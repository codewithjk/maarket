export class AppError extends Error{
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly details?: any;

    constructor(message: string, statusCode: number, isOperational = true, details?: any) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.details = details;
        Error.captureStackTrace(this);
    }
}

//Not Found Error
export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found') {
        super(message, 404,);
        this.name = 'NotFoundError';
    }
}

//Validation Error 
// use in joi/zod/react-hook-form validation
export class ValidationError extends AppError {
    constructor(message: string = 'Invalid request data', details?: any) {
        super(message, 400, true, details);
        this.name = 'ValidationError';
    }
}

//Unauthorized Error
export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized access') {
        super(message, 401, true);
        this.name = 'UnauthorizedError';
    }
}
//Forbidden Error
export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden access') {
        super(message, 403, true);
        this.name = 'ForbiddenError';
    }
}
//Internal Server Error
export class InternalServerError extends AppError {
    constructor(message: string = 'Internal server error', details?: any) {
        super(message, 500, false, details);
        this.name = 'InternalServerError';
    }
}
//Rate Limit Exceeded Error
export class RateLimitExceededError extends AppError {
    constructor(message: string = 'Rate limit exceeded') {
        super(message, 429, true);
        this.name = 'RateLimitExceededError';
    }
}