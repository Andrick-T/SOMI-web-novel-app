export class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, code, message, details) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}
export const createApiError = (statusCode, code, message, details) => {
    return new AppError(statusCode, code, message, details);
};
