import { Router, type RequestHandler } from "express";
import { validate } from "../../common/middleware/validate.js";
import { requireAuth } from "../auth/auth.middleware.js";
import type { AuthRequest } from "../auth/auth.types.js";
import { updateProfileSchema } from "./profile.schemas.js";
import { getProfile, updateProfile } from "./profile.service.js";

const asyncRoute =
  (handler: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);

export const profileRouter = Router();

profileRouter.use(requireAuth);

profileRouter.get(
  "/profile",
  asyncRoute(async (req: AuthRequest, res) => {
    res.json({
      profile: await getProfile(req.user),
    });
  }),
);

profileRouter.patch(
  "/profile",
  validate(updateProfileSchema),
  asyncRoute(async (req: AuthRequest, res) => {
    res.json({
      profile: await updateProfile(req.user, req.body),
    });
  }),
);
