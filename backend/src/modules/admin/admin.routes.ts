import { Router, type RequestHandler } from "express";
import { z } from "zod";
import { validate } from "../../common/middleware/validate.js";
import type { AuthRequest } from "../auth/auth.types.js";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";
import { updateBookSchema } from "../content/content.schemas.js";
import { updateBook } from "../content/content.service.js";
import {
  getAdminBookById,
  getAdminBooks,
  getAdminDashboardSummary,
  getAdminEconomySummary,
  getAdminTransactions,
  getAdminUserById,
  getAdminUsers,
  getAdminWriters,
  getAdminAuditEvents,
  getAdminPlatformSettings,
  updateAdminPlatformSettings,
  recordAdminAuditEvent,
} from "./admin.service.js";

const asyncRoute =
  (handler: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);

const adminQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
});

const adminBookQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.string().optional(),
  writerId: z.string().optional(),
});

const adminWriterQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.string().optional(),
});

const adminTransactionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  userId: z.string().optional(),
});

const adminAuditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  action: z.string().optional(),
  targetType: z.string().optional(),
});

const updatePlatformSettingsSchema = z
  .object({
    platformName: z.string().trim().min(1).max(100).optional(),

    supportEmail: z.string().trim().email().max(255).optional(),

    maintenanceMode: z.boolean().optional(),

    moderationEnabled: z.boolean().optional(),

    writerRegistrationEnabled: z.boolean().optional(),

    autoPublishEnabled: z.boolean().optional(),

    coinConversionRate: z.number().positive().optional(),

    minimumPurchase: z.number().int().min(0).optional(),

    chapterPricingRules: z.string().trim().min(1).max(2000).optional(),

    emailNotifications: z.boolean().optional(),

    moderationNotifications: z.boolean().optional(),

    paymentNotifications: z.boolean().optional(),

    sessionPolicy: z.string().trim().min(1).max(100).optional(),

    adminSessionTimeoutMinutes: z.number().int().min(1).max(1440).optional(),

    suspiciousActivityMonitoring: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one setting must be provided.",
  });

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("ADMIN"));

adminRouter.get(
  "/dashboard",
  asyncRoute(async (_req, res) => {
    res.json(await getAdminDashboardSummary());
  }),
);

adminRouter.get(
  "/users",
  validate(adminQuerySchema, "query"),
  asyncRoute(async (req: AuthRequest, res) => {
    const { search, role, status, page, limit } = req.query as {
      search?: string;
      role?: string;
      status?: string;
      page?: number;
      limit?: number;
    };

    const result = await getAdminUsers({
      search,
      role,
      status,
      page,
      limit,
    });

    res.json(result);
  }),
);

adminRouter.get(
  "/users/:userId",
  asyncRoute(async (req: AuthRequest, res) => {
    const result = await getAdminUserById(String(req.params.userId));

    res.json(result);
  }),
);

adminRouter.get(
  "/writers",
  validate(adminWriterQuerySchema, "query"),
  asyncRoute(async (req: AuthRequest, res) => {
    const { search, status, page, limit } = req.query as {
      search?: string;
      status?: string;
      page?: number;
      limit?: number;
    };

    const result = await getAdminWriters({
      search,
      status,
      page,
      limit,
    });

    res.json(result);
  }),
);

adminRouter.get(
  "/economy",
  asyncRoute(async (_req, res) => {
    res.json(await getAdminEconomySummary());
  }),
);

adminRouter.get(
  "/transactions",
  validate(adminTransactionQuerySchema, "query"),
  asyncRoute(async (req: AuthRequest, res) => {
    const { search, type, status, userId, page, limit } = req.query as {
      search?: string;
      type?: string;
      status?: string;
      userId?: string;
      page?: number;
      limit?: number;
    };

    const result = await getAdminTransactions({
      search,
      type,
      status,
      userId,
      page,
      limit,
    });

    res.json(result);
  }),
);

adminRouter.get(
  "/books",
  validate(adminBookQuerySchema, "query"),
  asyncRoute(async (req: AuthRequest, res) => {
    const { search, status, writerId, page, limit } = req.query as {
      search?: string;
      status?: string;
      writerId?: string;
      page?: number;
      limit?: number;
    };

    const result = await getAdminBooks({
      search,
      status,
      writerId,
      page,
      limit,
    });

    res.json(result);
  }),
);

adminRouter.patch(
  "/books/:bookId",
  validate(updateBookSchema),
  asyncRoute(async (req: AuthRequest, res) => {
    const bookId = String(req.params.bookId);

    const book = await updateBook(req.user, bookId, req.body);

    /**
     * Only record lifecycle changes that are actually supported
     * by the existing Book domain.
     */
    if (
      req.body?.status === "PUBLISHED" ||
      req.body?.status === "UNPUBLISHED"
    ) {
      const action =
        req.body.status === "PUBLISHED" ? "BOOK_PUBLISHED" : "BOOK_UNPUBLISHED";

      await recordAdminAuditEvent({
        actorId: req.user!.id,
        actorName: req.user!.email,
        action,
        targetType: "BOOK",
        targetId: bookId,
        metadata: {
          status: req.body.status,
        },
      });
    }

    res.json({ book });
  }),
);

adminRouter.get(
  "/books/:bookId",
  asyncRoute(async (req: AuthRequest, res) => {
    const result = await getAdminBookById(String(req.params.bookId));

    res.json(result);
  }),
);

/* -------------------------------------------------------------------------- */
/* Audit                                                                      */
/* -------------------------------------------------------------------------- */

adminRouter.get(
  "/audit",
  validate(adminAuditQuerySchema, "query"),
  asyncRoute(async (req: AuthRequest, res) => {
    const { search, action, targetType, page, limit } = req.query as {
      search?: string;
      action?: string;
      targetType?: string;
      page?: number;
      limit?: number;
    };

    const result = await getAdminAuditEvents({
      search,
      action,
      targetType,
      page,
      limit,
    });

    res.json(result);
  }),
);

/* -------------------------------------------------------------------------- */
/* Platform settings                                                          */
/* -------------------------------------------------------------------------- */
adminRouter.get(
  "/settings",
  asyncRoute(async (_req, res) => {
    const settings = await getAdminPlatformSettings();

    res.json({ settings });
  }),
);

adminRouter.patch(
  "/settings",
  validate(updatePlatformSettingsSchema),
  asyncRoute(async (req: AuthRequest, res) => {
    const result = await updateAdminPlatformSettings({
      actorId: req.user!.id,
      actorName: req.user!.email,
      changes: req.body,
    });

    res.json(result);
  }),
);
