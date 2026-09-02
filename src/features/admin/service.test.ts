import { describe, expect, it } from "vitest";
import {
  ADMIN_ROLES,
  can,
  canAccessAdminSection,
  getPermissionSummary,
  hasPermission,
  normalizeUserStatus,
  validateAuditEvent,
  validateSettings,
  getUserForAdmin,
  suspendUser,
  reactivateUser,
  banUser,
  changeUserRole,
  approveBook,
  rejectBook,
  reviewContent,
  resolveReport,
  dismissReport,
  filterTransactions,
  adjustWalletBalance,
  buildAuditEvent,
  requirePermission,
} from "./service";

describe("admin domain behavior", () => {
  it("checks permissions for admin sections", () => {
    expect(canAccessAdminSection("SUPER_ADMIN", "users.read")).toBe(true);
    expect(canAccessAdminSection("MODERATOR", "content.moderate")).toBe(true);
    expect(canAccessAdminSection("MODERATOR", "settings.manage")).toBe(false);
    expect(canAccessAdminSection("FINANCE_ADMIN", "economy.manage")).toBe(true);
    expect(hasPermission("ADMIN", "users.manage")).toBe(true);
    expect(can("ADMIN", "settings.manage")).toBe(false);
    expect(() => requirePermission("ADMIN", "settings.manage")).toThrow();
  });

  it("normalizes suspension and reactivation rules", () => {
    const activeUser = {
      id: "u-1",
      status: "ACTIVE" as const,
      role: "READER" as const,
    };
    const suspended = suspendUser(activeUser, "Spam");
    expect(suspended.status).toBe("SUSPENDED");
    expect(suspended.metadata?.reason).toBe("Spam");

    const reactivated = reactivateUser(activeUser, "Review complete");
    expect(reactivated.status).toBe("ACTIVE");
    expect(reactivated.metadata?.reason).toBe("Review complete");

    const banned = banUser(activeUser, "Abuse");
    expect(banned.status).toBe("BANNED");
    expect(banned.metadata?.reason).toBe("Abuse");
  });

  it("changes roles and keeps permissions aligned", () => {
    const updated = changeUserRole(
      { id: "u-1", role: "READER" as const, status: "ACTIVE" as const },
      "WRITER",
    );
    expect(updated.role).toBe("WRITER");
    expect(getPermissionSummary("SUPER_ADMIN")).toContain("users.manage");
  });

  it("approves and rejects book moderation workflows", () => {
    const approved = approveBook({
      id: "b-1",
      moderationStatus: "READY_FOR_REVIEW" as const,
    });
    expect(approved.moderationStatus).toBe("PUBLISHED");

    const rejection = rejectBook(
      { id: "b-2", moderationStatus: "READY_FOR_REVIEW" as const },
      "Policy violation",
    );
    expect(rejection.moderationStatus).toBe("REJECTED");
    expect(rejection.metadata?.reason).toBe("Policy violation");

    const invalid = rejectBook(
      { id: "b-3", moderationStatus: "PUBLISHED" as const },
      "",
    );
    expect(invalid.valid).toBe(false);

    const changesRequested = reviewContent(
      { id: "b-4", status: "READY_FOR_REVIEW" as const },
      "CHANGES_REQUESTED",
      "Please tighten the final act.",
    );
    expect(changesRequested.status).toBe("EDITING");
    expect(changesRequested.metadata?.reason).toBe(
      "Please tighten the final act.",
    );
  });

  it("resolves and dismisses reports with notes", () => {
    const resolved = resolveReport(
      { id: "r-1", status: "OPEN" as const },
      "Issue handled",
    );
    expect(resolved.status).toBe("RESOLVED");
    expect(resolved.resolution).toContain("Issue handled");

    const dismissed = dismissReport(
      { id: "r-2", status: "OPEN" as const },
      "No violation found",
    );
    expect(dismissed.status).toBe("DISMISSED");
    expect(dismissed.resolution).toContain("No violation found");
  });

  it("filters transactions by type and status", () => {
    const txs = [
      { id: "t1", type: "COIN_PURCHASE", status: "COMPLETED" },
      { id: "t2", type: "REFUND", status: "PENDING" },
      { id: "t3", type: "CHAPTER_UNLOCK", status: "FAILED" },
    ];
    expect(filterTransactions(txs, { type: "COIN_PURCHASE" }).length).toBe(1);
    expect(filterTransactions(txs, { status: "PENDING" }).length).toBe(1);
  });

  it("validates wallet adjustments and creates audit events", () => {
    const adjustment = adjustWalletBalance({ id: "u-1" }, 100, "manual credit");
    expect(adjustment.valid).toBe(true);
    expect(adjustment.amount).toBe(100);

    const invalid = adjustWalletBalance({ id: "u-1" }, 0, "");
    expect(invalid.valid).toBe(false);

    const event = buildAuditEvent({
      actorId: "admin-1",
      actorName: "Amina",
      action: "WALLET_ADJUSTED",
      targetType: "USER",
      targetId: "u-1",
      metadata: { amount: 100 },
    });
    expect(event.action).toBe("WALLET_ADJUSTED");
  });

  it("validates settings payloads", () => {
    const result = validateSettings({
      platformName: "SOMI",
      supportEmail: "support@somi.app",
      maintenanceMode: false,
      moderationEnabled: true,
      coinConversionRate: 100,
      minimumPurchase: 25,
      adminSessionTimeoutMinutes: 60,
    });

    expect(result.isValid).toBe(true);
    expect(
      validateSettings({ platformName: "", supportEmail: "bad-email" }).isValid,
    ).toBe(false);
  });

  it("validates and builds audit events from raw items", () => {
    const result = validateAuditEvent({
      id: "ae-1",
      actorId: "admin-1",
      actorName: "Amina",
      action: "ROLE_CHANGED",
      targetType: "USER",
      targetId: "u-1",
      metadata: { role: "WRITER" },
      timestamp: new Date().toISOString(),
    });
    expect(result.isValid).toBe(true);
  });

  it("exposes admin role metadata", () => {
    expect(ADMIN_ROLES.SUPER_ADMIN.permissions).toContain("settings.manage");
    expect(ADMIN_ROLES.MODERATOR.permissions).toContain("content.moderate");
    expect(ADMIN_ROLES.FINANCE_ADMIN.permissions).toContain("economy.manage");
  });
});
