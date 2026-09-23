import { Router } from "express";
import { validate } from "../../common/middleware/validate.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { updateProfileSchema } from "./profile.schemas.js";
import { getProfile, updateProfile } from "./profile.service.js";
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
export const profileRouter = Router();
profileRouter.use(requireAuth);
profileRouter.get("/profile", asyncRoute(async (req, res) => {
    res.json({
        profile: await getProfile(req.user),
    });
}));
profileRouter.patch("/profile", validate(updateProfileSchema), asyncRoute(async (req, res) => {
    res.json({
        profile: await updateProfile(req.user, req.body),
    });
}));
