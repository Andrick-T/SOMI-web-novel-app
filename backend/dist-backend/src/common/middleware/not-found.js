export const notFoundHandler = (req, res, _next) => {
    res.status(404).json({
        success: false,
        error: {
            code: "NOT_FOUND",
            message: `Route ${req.method} ${req.originalUrl} was not found.`,
            details: [],
        },
    });
};
