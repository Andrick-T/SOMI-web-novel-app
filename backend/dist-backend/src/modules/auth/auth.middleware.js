import { AppError } from "../../common/errors/http-error.js";
import { prisma } from "../../config/database.js";
import { verifyAccessToken } from "./auth.crypto.js";
import { hasPermission } from "./auth.types.js";
export async function requireAuth(req, _res, next) {
    try {
        const token = req.headers.authorization?.startsWith("Bearer ")
            ? req.headers.authorization.slice(7)
            : "";
        const payload = verifyAccessToken(token);
        if (payload.type !== "access" || typeof payload.sub !== "string")
            throw new Error("Invalid token");
        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true, role: true, status: true },
        });
        if (!user || user.status !== "ACTIVE")
            throw new Error("Inactive user");
        req.user = user;
        next();
    }
    catch {
        next(new AppError(401, "UNAUTHENTICATED", "Authentication required."));
    }
}
export async function optionalAuth(req, _res, next) {
    try {
        const token = req.headers.authorization?.startsWith("Bearer ")
            ? req.headers.authorization.slice(7)
            : "";
        if (!token)
            return next();
        const payload = verifyAccessToken(token);
        if (payload.type !== "access" || typeof payload.sub !== "string")
            return next();
        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true, role: true, status: true },
        });
        if (!user || user.status !== "ACTIVE")
            return next();
        req.user = user;
        return next();
    }
    catch {
        return next();
    }
}
export const requireRole = (...roles) => (req, _res, next) => {
    if (!req.user)
        return next(new AppError(401, "UNAUTHENTICATED", "Authentication required."));
    if (!roles.some((role) => role.toUpperCase() === req.user.role.toUpperCase()))
        return next(new AppError(403, "FORBIDDEN", "You do not have permission to perform this action."));
    next();
};
export const requirePermission = (permission) => (req, _res, next) => {
    if (!req.user)
        return next(new AppError(401, "UNAUTHENTICATED", "Authentication required."));
    if (!hasPermission(req.user.role, permission))
        return next(new AppError(403, "FORBIDDEN", "You do not have permission to perform this action."));
    next();
};
