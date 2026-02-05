export class CarrierError extends Error {
    constructor(
        public code: string,
        message: string,
        public carrier: string,
        public details?: any
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends CarrierError {
    constructor(message: string, details?: any) {
        super('VALIDATION_ERROR', message, 'SYSTEM', details);
    }
}

export class AuthenticationError extends CarrierError {
    constructor(message: string, carrier: string, details?: any) {
        super('AUTH_ERROR', message, carrier, details);
    }
}

export class NetworkError extends CarrierError {
    constructor(message: string, carrier: string, details?: any) {
        super('NETWORK_ERROR', message, carrier, details);
    }
}

export class RateLimitError extends CarrierError {
    constructor(message: string, carrier: string, details?: any) {
        super('RATE_LIMIT_ERROR', message, carrier, details);
    }
}

export class ApiError extends CarrierError {
    constructor(
        code: string,
        message: string,
        carrier: string,
        public statusCode: number,
        details?: any
    ) {
        super(code, message, carrier, details);
    }
}
