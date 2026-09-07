import { AppError } from "../../common/errors/http-error.js";
import type { AuthRequest } from "./auth.types.js";

export const isOwner = (request: AuthRequest, ownerId: string) =>
  request.user?.id === ownerId;

export const assertOwnership = (request: AuthRequest, ownerId: string) => {
  if (!request.user) {
    throw new AppError(401, "UNAUTHENTICATED", "Authentication required.");
  }

  if (!isOwner(request, ownerId)) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "You do not have permission to perform this action.",
    );
  }
};
