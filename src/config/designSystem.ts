import type { AppEnvironment, Page } from "../types";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export const roleThemes: Record<
  AppEnvironment,
  { background: string; accent: string }
> = {
  reader: { background: "#0d0b18", accent: "#e8a84c" },
  writer: { background: "#131510", accent: "#4ade80" },
  admin: { background: "#0e1422", accent: "#60a5fa" },
};

export const navigation = {
  reader: [
    { page: "home" as Page, label: "Home" },
    { page: "discover" as Page, label: "Discover" },
    { page: "library" as Page, label: "Library" },
  ],
  writer: [
    { page: "writer-dashboard" as Page, label: "Dashboard" },
    { page: "writer-books" as Page, label: "My Books" },
    { page: "writer-analytics" as Page, label: "Analytics" },
    { page: "writer-earnings" as Page, label: "Earnings" },
  ],
  admin: [
    { page: "admin-dashboard" as Page, label: "Overview" },
    { page: "admin-users" as Page, label: "Users" },
    { page: "admin-writers" as Page, label: "Writers" },
    { page: "admin-content" as Page, label: "Content" },
    { page: "admin-reports" as Page, label: "Reports" },
    { page: "admin-economy" as Page, label: "Economy" },
    { page: "admin-transactions" as Page, label: "Transactions" },
    { page: "admin-audit" as Page, label: "Audit" },
    { page: "admin-settings" as Page, label: "Settings" },
  ],
} as const;

export const statusToneFor = (status: string): StatusTone => {
  const normalized = status.toUpperCase();
  if (
    ["COMPLETED", "PUBLISHED", "APPROVED", "ACTIVE", "UNLOCKED"].includes(
      normalized,
    )
  )
    return "success";
  if (
    [
      "UPCOMING",
      "PENDING",
      "DRAFT",
      "EDITING",
      "READY_FOR_REVIEW",
      "SCHEDULED",
      "UNDER_REVIEW",
    ].includes(normalized)
  )
    return "warning";
  if (
    [
      "PAUSED",
      "REJECTED",
      "BANNED",
      "SUSPENDED",
      "FAILED",
      "DISMISSED",
    ].includes(normalized)
  )
    return "danger";
  if (["READER", "WRITER", "ADMIN", "INFO"].includes(normalized)) return "info";
  return "neutral";
};
