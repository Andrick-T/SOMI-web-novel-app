import { AppError } from "../../common/errors/http-error.js";
export const isOwner = (request, ownerId) => request.user?.id === ownerId;
export const assertOwnership = (request, ownerId) => {
    if (!request.user) {
        throw new AppError(401, "UNAUTHENTICATED", "Authentication required.");
    }
    if (!isOwner(request, ownerId)) {
        throw new AppError(403, "FORBIDDEN", "You do not have permission to perform this action.");
    }
};
