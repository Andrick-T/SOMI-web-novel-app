import { AppError } from "./http-error.js";
export const errorHandler = (error, _req, res, _next) => {
    const appError = error;
    if (error instanceof AppError) {
        return res.status(appError.statusCode).json({
            success: false,
            error: {
                code: appError.code,
                message: appError.message,
                details: appError.details ?? [],
            },
        });
    }
    const parsedMessage = error instanceof Error ? error.message : "Unexpected server error.";
    return res.status(500).json({
        success: false,
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: process.env.NODE_ENV === "production"
                ? "A server error occurred."
                : parsedMessage,
            details: [],
        },
    });
};
