import { mockAdminRepository } from "./repository";
import type {
  AdminBook,
  AdminDashboardSummary,
  AdminPermission,
  AdminReport,
  AdminRole,
  AdminTransaction,
  AdminUser,
  AdminUserRole,
  AuditAction,
  AuditEvent,
  AdminValidationResult,
  ContentFilters,
  PlatformSettings,
  ReportFilters,
  ReportStatus,
  TransactionFilters,
  TransactionStatus,
  TransactionType,
  UserFilters,
  UserStatus,
  ValidationError,
} from "./types";

export const ADMIN_ROLES: Record<
  AdminRole,
  { label: string; permissions: AdminPermission[] }
> = {
  SUPER_ADMIN: {
    label: "Super admin",
    permissions: [
      "ADMIN_DASHBOARD_VIEW",
      "USER_VIEW",
      "USER_EDIT",
      "USER_SUSPEND",
      "WRITER_VIEW",
      "WRITER_MANAGE",
      "CONTENT_VIEW",
      "CONTENT_REVIEW",
      "CONTENT_APPROVE",
      "CONTENT_REJECT",
      "CONTENT_UNPUBLISH",
      "REPORT_VIEW",
      "REPORT_RESOLVE",
      "ECONOMY_VIEW",
      "ECONOMY_MANAGE",
      "TRANSACTION_VIEW",
      "SETTINGS_VIEW",
      "SETTINGS_MANAGE",
      "AUDIT_VIEW",
      "users.read",
      "users.manage",
      "content.read",
      "content.moderate",
      "content.publish",
      "content.unpublish",
      "economy.read",
      "economy.manage",
      "transactions.read",
      "reports.read",
      "reports.resolve",
      "audit.read",
      "settings.read",
      "settings.manage",
    ],
  },
  ADMIN: {
    label: "Admin",
    permissions: [
      "ADMIN_DASHBOARD_VIEW",
      "USER_VIEW",
      "USER_EDIT",
      "USER_SUSPEND",
      "WRITER_VIEW",
      "WRITER_MANAGE",
      "CONTENT_VIEW",
      "CONTENT_REVIEW",
      "CONTENT_APPROVE",
      "CONTENT_REJECT",
      "CONTENT_UNPUBLISH",
      "REPORT_VIEW",
      "REPORT_RESOLVE",
      "ECONOMY_VIEW",
      "TRANSACTION_VIEW",
      "SETTINGS_VIEW",
      "AUDIT_VIEW",
      "users.read",
      "users.manage",
      "content.read",
      "content.moderate",
      "content.publish",
      "content.unpublish",
      "economy.read",
      "transactions.read",
      "reports.read",
      "reports.resolve",
      "audit.read",
      "settings.read",
    ],
  },
  MODERATOR: {
    label: "Moderator",
    permissions: [
      "ADMIN_DASHBOARD_VIEW",
      "CONTENT_VIEW",
      "CONTENT_REVIEW",
      "CONTENT_APPROVE",
      "CONTENT_REJECT",
      "REPORT_VIEW",
      "REPORT_RESOLVE",
      "AUDIT_VIEW",
      "users.read",
      "content.read",
      "content.moderate",
      "reports.read",
      "reports.resolve",
      "audit.read",
    ],
  },
  FINANCE_ADMIN: {
    label: "Finance admin",
    permissions: [
      "ADMIN_DASHBOARD_VIEW",
      "ECONOMY_VIEW",
      "ECONOMY_MANAGE",
      "TRANSACTION_VIEW",
      "REPORT_VIEW",
      "AUDIT_VIEW",
      "economy.read",
      "economy.manage",
      "transactions.read",
      "reports.read",
      "audit.read",
      "settings.read",
    ],
  },
};

export function hasPermission(
  role: AdminRole,
  permission: AdminPermission,
): boolean {
  return ADMIN_ROLES[role]?.permissions.includes(permission) ?? false;
}

export function can(role: AdminRole, permission: AdminPermission): boolean {
  return hasPermission(role, permission);
}

export function requirePermission(
  role: AdminRole,
  permission: AdminPermission,
): true {
  if (!hasPermission(role, permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
  return true;
}

export function canAccessAdminSection(
  role: AdminRole,
  permission: AdminPermission,
): boolean {
  return hasPermission(role, permission);
}

export function getPermissionSummary(role: AdminRole): AdminPermission[] {
  return ADMIN_ROLES[role].permissions;
}

export function normalizeUserStatus(status: string): UserStatus {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "ACTIVE";
    case "SUSPENDED":
      return "SUSPENDED";
    case "BANNED":
      return "BANNED";
    case "PENDING":
      return "PENDING";
    default:
      return "PENDING";
  }
}

export function validateSettings(
  settings: Partial<PlatformSettings>,
): AdminValidationResult {
  const errors: ValidationError[] = [];

  if (!settings.platformName || !settings.platformName.trim()) {
    errors.push({
      field: "platformName",
      message: "Platform name is required.",
    });
  }

  if (
    settings.supportEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.supportEmail)
  ) {
    errors.push({
      field: "supportEmail",
      message: "Support email is invalid.",
    });
  }

  if (
    typeof settings.coinConversionRate === "number" &&
    settings.coinConversionRate <= 0
  ) {
    errors.push({
      field: "coinConversionRate",
      message: "Coin conversion rate must be greater than zero.",
    });
  }

  if (
    typeof settings.minimumPurchase === "number" &&
    settings.minimumPurchase < 0
  ) {
    errors.push({
      field: "minimumPurchase",
      message: "Minimum purchase must be zero or greater.",
    });
  }

  if (
    typeof settings.adminSessionTimeoutMinutes === "number" &&
    settings.adminSessionTimeoutMinutes < 5
  ) {
    errors.push({
      field: "adminSessionTimeoutMinutes",
      message: "Session timeout must be at least 5 minutes.",
    });
  }

  return { isValid: errors.length === 0, errors };
}

export function validateAuditEvent(
  event: Partial<AuditEvent>,
): AdminValidationResult {
  const errors: ValidationError[] = [];
  if (!event.actorId)
    errors.push({ field: "actorId", message: "Actor is required." });
  if (!event.action)
    errors.push({ field: "action", message: "Action is required." });
  if (!event.targetId)
    errors.push({ field: "targetId", message: "Target is required." });
  if (!event.timestamp)
    errors.push({ field: "timestamp", message: "Timestamp is required." });
  return { isValid: errors.length === 0, errors };
}

export function buildAuditEvent(input: Partial<AuditEvent>): AuditEvent {
  const next: AuditEvent = {
    id: input.id ?? `audit-${Date.now()}`,
    actorId: input.actorId ?? "system",
    actorName: input.actorName ?? "System",
    action: (input.action ?? "SETTING_CHANGED") as AuditAction,
    targetType: input.targetType ?? "SYSTEM",
    targetId: input.targetId ?? "system",
    metadata: input.metadata ?? {},
    timestamp: input.timestamp ?? new Date().toISOString(),
  };

  const validation = validateAuditEvent(next);
  if (!validation.isValid) {
    throw new Error(validation.errors.map((error) => error.message).join(", "));
  }

  return next;
}

export function getUserForAdmin(
  users: AdminUser[],
  userId: string,
): AdminUser | undefined {
  return users.find((user) => user.id === userId);
}

export function suspendUser(
  user: Pick<AdminUser, "id" | "status" | "role">,
  reason: string,
): { status: UserStatus; valid: boolean; metadata: Record<string, unknown> } {
  return {
    status: "SUSPENDED",
    valid: Boolean(reason && reason.trim()),
    metadata: { reason },
  };
}

export function reactivateUser(
  user: Pick<AdminUser, "id" | "status" | "role">,
  reason: string,
): { status: UserStatus; valid: boolean; metadata: Record<string, unknown> } {
  return {
    status: "ACTIVE",
    valid: Boolean(user.id && reason && reason.trim()),
    metadata: { reason },
  };
}

export function banUser(
  user: Pick<AdminUser, "id" | "status" | "role">,
  reason: string,
): { status: UserStatus; valid: boolean; metadata: Record<string, unknown> } {
  return {
    status: "BANNED",
    valid: Boolean(reason && reason.trim()),
    metadata: { reason },
  };
}

export function changeUserRole(
  user: Pick<AdminUser, "id" | "status" | "role">,
  role: AdminUserRole,
): Pick<AdminUser, "id" | "status" | "role"> {
  return { ...user, role };
}

export function approveBook(
  book: Pick<AdminBook, "id" | "moderationStatus">,
): Pick<AdminBook, "id" | "moderationStatus"> & {
  metadata?: Record<string, unknown>;
} {
  return {
    id: book.id,
    moderationStatus: "PUBLISHED",
    metadata: { approvedAt: new Date().toISOString() },
  };
}

export function rejectBook(
  book: Pick<AdminBook, "id" | "moderationStatus">,
  reason: string,
): {
  id: string;
  moderationStatus: AdminBook["moderationStatus"];
  valid: boolean;
  metadata: Record<string, unknown>;
} {
  return {
    id: book.id,
    moderationStatus: "REJECTED",
    valid: Boolean(reason && reason.trim()),
    metadata: { reason },
  };
}

export function reviewContent(
  book: Pick<AdminBook, "id" | "status">,
  decision:
    | "APPROVED"
    | "REJECTED"
    | "CHANGES_REQUESTED"
    | "UNPUBLISHED"
    | "ARCHIVED",
  reason?: string,
): {
  id: string;
  status: AdminBook["status"];
  valid: boolean;
  metadata: Record<string, unknown>;
} {
  const normalizedReason = reason?.trim() ?? "";
  const statusMap: Record<typeof decision, AdminBook["status"]> = {
    APPROVED: "PUBLISHED",
    REJECTED: "REJECTED",
    CHANGES_REQUESTED: "EDITING",
    UNPUBLISHED: "UNPUBLISHED",
    ARCHIVED: "ARCHIVED",
  };

  return {
    id: book.id,
    status: statusMap[decision],
    valid: decision === "CHANGES_REQUESTED" ? Boolean(normalizedReason) : true,
    metadata: { decision, reason: normalizedReason || "No reason provided." },
  };
}

export function resolveReport(
  report: Pick<AdminReport, "id" | "status">,
  resolution: string,
): Pick<AdminReport, "id" | "status" | "resolution"> {
  return {
    id: report.id,
    status: "RESOLVED",
    resolution: resolution || "Resolved by admin review.",
  };
}

export function dismissReport(
  report: Pick<AdminReport, "id" | "status">,
  reason: string,
): Pick<AdminReport, "id" | "status" | "resolution"> {
  return {
    id: report.id,
    status: "DISMISSED",
    resolution: reason || "Dismissed after review.",
  };
}

export function filterTransactions(
  transactions: Pick<AdminTransaction, "id" | "type" | "status">[],
  filters: TransactionFilters,
): Pick<AdminTransaction, "id" | "type" | "status">[] {
  return transactions.filter((transaction) => {
    const matchesType =
      !filters.type ||
      filters.type === "ALL" ||
      transaction.type === filters.type;
    const matchesStatus =
      !filters.status ||
      filters.status === "ALL" ||
      transaction.status === filters.status;
    return matchesType && matchesStatus;
  });
}

export function adjustWalletBalance(
  user: Pick<AdminUser, "id">,
  amount: number,
  reason: string,
): { valid: boolean; amount: number; reason: string } {
  return {
    valid: Boolean(user.id && amount !== 0 && reason && reason.trim()),
    amount,
    reason,
  };
}

export const adminService = {
  getDashboardSummary(): AdminDashboardSummary {
    return mockAdminRepository.getDashboardSummary();
  },
  getUsers(filters: UserFilters = {}): AdminUser[] {
    const users = mockAdminRepository.getUsers();
    const query = filters.query?.trim() ?? "";
    const role =
      filters.role === "ALL" || !filters.role ? undefined : filters.role;
    const status =
      filters.status === "ALL" || !filters.status ? undefined : filters.status;

    const filtered = users.filter((user) => {
      const text = `${user.name} ${user.email}`.toLowerCase();
      const matchesQuery = !query || text.includes(query.toLowerCase());
      const matchesRole = !role || user.role === role;
      const matchesStatus = !status || user.status === status;
      return matchesQuery && matchesRole && matchesStatus;
    });

    return filtered.slice(
      filters.offset ?? 0,
      (filters.offset ?? 0) + (filters.limit ?? filtered.length),
    );
  },
  getUser(userId: string) {
    return mockAdminRepository.getUser(userId);
  },
  changeUserRole(userId: string, role: AdminUserRole) {
    const current = mockAdminRepository.getUser(userId);
    if (!current) {
      return undefined;
    }
    const next = mockAdminRepository.updateUser(userId, { role });
    return next;
  },
  suspendUser(userId: string, reason: string) {
    const current = mockAdminRepository.getUser(userId);
    if (!current) {
      return undefined;
    }
    return mockAdminRepository.updateUser(userId, {
      status: "SUSPENDED",
      metadata: { ...(current.metadata ?? {}), reason },
    });
  },
  banUser(userId: string, reason: string) {
    const current = mockAdminRepository.getUser(userId);
    if (!current) {
      return undefined;
    }
    return mockAdminRepository.updateUser(userId, {
      status: "BANNED",
      metadata: { ...(current.metadata ?? {}), reason },
    });
  },
  restoreUser(userId: string) {
    const current = mockAdminRepository.getUser(userId);
    if (!current) {
      return undefined;
    }
    return mockAdminRepository.updateUser(userId, {
      status: "ACTIVE",
      metadata: {
        ...(current.metadata ?? {}),
        restoredAt: new Date().toISOString(),
      },
    });
  },
  getContent(filters: ContentFilters = {}) {
    let books = mockAdminRepository.getBooks();
    if (filters.query) {
      books = books.filter((book) =>
        `${book.title} ${book.writer}`
          .toLowerCase()
          .includes(filters.query!.toLowerCase()),
      );
    }
    if (filters.status && filters.status !== "ALL") {
      books = books.filter((book) => book.status === filters.status);
    }
    if (filters.moderationStatus && filters.moderationStatus !== "ALL") {
      books = books.filter(
        (book) => book.moderationStatus === filters.moderationStatus,
      );
    }
    if (filters.genre && filters.genre !== "ALL") {
      books = books.filter(
        (book) => book.genre.toLowerCase() === filters.genre.toLowerCase(),
      );
    }
    if (filters.writer && filters.writer !== "ALL") {
      books = books.filter((book) =>
        book.writer.toLowerCase().includes(filters.writer.toLowerCase()),
      );
    }
    return books;
  },
  getBookForModeration(bookId: string) {
    return mockAdminRepository.getBook(bookId);
  },
  approveBook(bookId: string) {
    const current = mockAdminRepository.getBook(bookId);
    if (!current) return undefined;
    return mockAdminRepository.updateBook(bookId, {
      status: "PUBLISHED",
      moderationStatus: "APPROVED",
      metadata: {
        ...(current.metadata ?? {}),
        approvedAt: new Date().toISOString(),
      },
    });
  },
  rejectBook(bookId: string, reason: string) {
    const current = mockAdminRepository.getBook(bookId);
    if (!current) return undefined;
    if (!reason || !reason.trim()) {
      return undefined;
    }
    return mockAdminRepository.updateBook(bookId, {
      status: "REJECTED",
      moderationStatus: "REJECTED",
      metadata: { ...(current.metadata ?? {}), rejectionReason: reason },
    });
  },
  requestBookChanges(bookId: string, feedback: string) {
    const current = mockAdminRepository.getBook(bookId);
    if (!current) return undefined;
    return mockAdminRepository.updateBook(bookId, {
      status: "EDITING",
      moderationStatus: "CHANGES_REQUESTED",
      metadata: { ...(current.metadata ?? {}), feedback },
    });
  },
  unpublishBook(bookId: string, reason: string) {
    const current = mockAdminRepository.getBook(bookId);
    if (!current) return undefined;
    return mockAdminRepository.updateBook(bookId, {
      status: "UNPUBLISHED",
      metadata: { ...(current.metadata ?? {}), unpublishReason: reason },
    });
  },
  getReports(filters: ReportFilters = {}) {
    const reports = mockAdminRepository.getReports();
    const status =
      filters.status === "ALL" || !filters.status ? undefined : filters.status;
    const targetType =
      filters.targetType === "ALL" || !filters.targetType
        ? undefined
        : filters.targetType;
    return reports.filter((report) => {
      const matchesStatus = !status || report.status === status;
      const matchesType = !targetType || report.targetType === targetType;
      return matchesStatus && matchesType;
    });
  },
  assignReport(reportId: string, adminId: string) {
    return mockAdminRepository.updateReport(reportId, {
      assignedAdmin: adminId,
    });
  },
  resolveReport(reportId: string, resolution: string) {
    return mockAdminRepository.updateReport(reportId, {
      status: "RESOLVED",
      resolution,
    });
  },
  dismissReport(reportId: string, reason: string) {
    return mockAdminRepository.updateReport(reportId, {
      status: "DISMISSED",
      resolution: reason,
    });
  },
  getEconomySummary() {
    return mockAdminRepository.getEconomySummary();
  },
  getTransactions(filters: TransactionFilters = {}) {
    let transactions = mockAdminRepository.getTransactions();
    if (filters.type && filters.type !== "ALL") {
      transactions = transactions.filter(
        (transaction) => transaction.type === filters.type,
      );
    }
    if (filters.status && filters.status !== "ALL") {
      transactions = transactions.filter(
        (transaction) => transaction.status === filters.status,
      );
    }
    if (filters.userId) {
      transactions = transactions.filter(
        (transaction) => transaction.userId === filters.userId,
      );
    }
    return transactions;
  },
  adjustWalletBalance(userId: string, amount: number, reason: string) {
    const valid = Boolean(userId && amount !== 0 && reason && reason.trim());
    return {
      valid,
      userId,
      amount,
      reason,
    };
  },
  getAuditEvents() {
    return mockAdminRepository.getAuditEvents();
  },
  getPlatformSettings() {
    return mockAdminRepository.getPlatformSettings();
  },
  updatePlatformSettings(settings: Partial<PlatformSettings>) {
    const validated = validateSettings(settings);
    if (!validated.isValid) {
      return undefined;
    }
    const updated = mockAdminRepository.updatePlatformSettings(settings);
    mockAdminRepository.createAuditEvent({
      actorId: "admin-system",
      actorName: "System",
      action: "SETTING_CHANGED",
      targetType: "SETTINGS",
      targetId: "platform",
      metadata: { changes: settings },
      timestamp: new Date().toISOString(),
    });
    return updated;
  },
  recordAuditEvent(event: Partial<AuditEvent>) {
    return mockAdminRepository.createAuditEvent(event);
  },
  applyUserStatus(userId: string, status: UserStatus, reason: string) {
    const current = mockAdminRepository.getUser(userId);
    if (!current) {
      return undefined;
    }
    const next = mockAdminRepository.updateUser(userId, {
      status,
      metadata: {
        ...(current.metadata ?? {}),
        reason,
        updatedAt: new Date().toISOString(),
      },
    });
    if (!next) {
      return undefined;
    }
    mockAdminRepository.createAuditEvent({
      actorId: "admin-system",
      actorName: "System",
      action: status === "SUSPENDED" ? "USER_SUSPENDED" : "USER_REACTIVATED",
      targetType: "USER",
      targetId: userId,
      metadata: { reason, status },
      timestamp: new Date().toISOString(),
    });
    return next;
  },
  reviewContentDecision(
    bookId: string,
    decision: "APPROVED" | "REJECTED" | "UNPUBLISHED" | "CHANGES_REQUESTED",
    reason: string,
  ) {
    const current = mockAdminRepository.getBook(bookId);
    if (!current) {
      return undefined;
    }

    const decisionMap = {
      APPROVED: {
        status: "PUBLISHED",
        moderationStatus: "APPROVED",
        action: "BOOK_APPROVED",
      },
      REJECTED: {
        status: "REJECTED",
        moderationStatus: "REJECTED",
        action: "BOOK_REJECTED",
      },
      UNPUBLISHED: {
        status: "UNPUBLISHED",
        moderationStatus: "UNPUBLISHED",
        action: "BOOK_UNPUBLISHED",
      },
      CHANGES_REQUESTED: {
        status: "EDITING",
        moderationStatus: "CHANGES_REQUESTED",
        action: "BOOK_REJECTED",
      },
    } as const;

    const outcome = decisionMap[decision];
    const updated = mockAdminRepository.updateBook(bookId, {
      status: outcome.status,
      moderationStatus: outcome.moderationStatus,
      metadata: {
        ...(current.metadata ?? {}),
        reason,
        updatedAt: new Date().toISOString(),
      },
    });

    if (!updated) {
      return undefined;
    }

    mockAdminRepository.createAuditEvent({
      actorId: "admin-system",
      actorName: "System",
      action: outcome.action,
      targetType: "BOOK",
      targetId: bookId,
      metadata: { decision, reason },
      timestamp: new Date().toISOString(),
    });

    return updated;
  },
};

export type AdminService = typeof adminService;
