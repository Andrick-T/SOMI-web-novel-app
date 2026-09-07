import { AppError } from "../errors/http-error.js";
export const validate = (schema, source = "body") => {
    return (req, _res, next) => {
        const payload = req[source];
        const parsed = schema.safeParse(payload);
        if (!parsed.success) {
            const details = parsed.error.issues.map((issue) => ({
                field: issue.path.join(".") || "root",
                message: issue.message,
            }));
            throw new AppError(400, "VALIDATION_ERROR", "Request validation failed.", details);
        }
        req[source] = parsed.data;
        next();
    };
};
