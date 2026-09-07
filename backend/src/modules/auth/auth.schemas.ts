import { z } from "zod";

const password = z.string().min(8).max(128);
export const registerSchema = z.object({ email: z.string().email().toLowerCase(), password, name: z.string().trim().min(1).max(100) });
export const loginSchema = z.object({ email: z.string().email().toLowerCase(), password });
export const refreshSchema = z.object({ refreshToken: z.string().min(20).optional() });
export const changePasswordSchema = z.object({ currentPassword: password, newPassword: password }).refine((value) => value.currentPassword !== value.newPassword, { message: "New password must differ from current password.", path: ["newPassword"] });