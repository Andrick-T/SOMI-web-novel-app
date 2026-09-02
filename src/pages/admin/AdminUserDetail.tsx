import { useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Mail,
  Shield,
  UserRound,
} from "lucide-react";
import { mockAdminRepository } from "../../features/admin";
import { StatusBadge } from "../../components/DesignPrimitives";
import { statusToneFor } from "../../config/designSystem";
import type { CommonProps } from "../../types";

export default function AdminUserDetail({ navigate }: CommonProps) {
  const { userId } = useParams();
  const user = useMemo(
    () => (userId ? mockAdminRepository.getUser(userId) : undefined),
    [userId],
  );

  if (!user) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[var(--color-background)] px-5">
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-6 text-center">
          <p className="text-sm font-semibold text-[var(--color-status-danger)]">
            User not found
          </p>
          <button
            type="button"
            onClick={() => navigate("admin-users")}
            className="somi-control mt-4 rounded-lg bg-[rgba(96,165,250,0.12)] px-3 py-2 text-xs font-semibold text-[var(--color-accent-primary)]"
          >
            Back to users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[var(--color-background)] px-5 py-8 text-[var(--color-text-primary)]">
      <div className="mb-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate("admin-users")}
          className="somi-control flex items-center gap-2 rounded-lg bg-[rgba(96,165,250,0.1)] px-3 py-2 text-xs font-semibold text-[var(--color-accent-primary)]"
        >
          <ArrowLeft size={14} />
          Users
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(96,165,250,0.12)] text-lg font-bold text-[var(--color-accent-primary)]">
            {user.avatar}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              {user.name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <StatusBadge
                label={user.role}
                tone={statusToneFor(user.role)}
                compact
              />
              <StatusBadge
                label={user.status}
                tone={statusToneFor(user.status)}
                compact
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-[var(--color-background)] p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              Identity
            </p>
            <div className="space-y-3 text-sm text-[var(--color-text-secondary)]">
              <div className="flex items-center gap-2">
                <Mail size={14} color="var(--color-accent-primary)" />{" "}
                {user.email}
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck size={14} color="var(--color-accent-primary)" />{" "}
                {user.role}
              </div>
              <div className="flex items-center gap-2">
                <Shield size={14} color="var(--color-accent-primary)" />{" "}
                {user.status}
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays size={14} color="var(--color-accent-primary)" />{" "}
                Joined {new Date(user.joinedAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                <UserRound size={14} color="var(--color-accent-primary)" /> Last
                active {new Date(user.lastActiveAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-[var(--color-background)] p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              Administrative actions
            </p>
            <div className="flex flex-wrap gap-2">
              {["Change role", "Suspend", "Ban", "Restore"].map((label) => (
                <button
                  key={label}
                  type="button"
                  className="somi-control rounded-lg bg-[rgba(96,165,250,0.12)] px-3 py-2 text-xs font-semibold text-[var(--color-accent-primary)]"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-[var(--color-background)] p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              Activity
            </p>
            <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              <li>Books: {user.booksPublished}</li>
              <li>Chapters: 14</li>
              <li>Reading activity: 48 sessions</li>
              <li>Transactions: 12</li>
              <li>Reports: 2</li>
            </ul>
          </div>

          <div className="rounded-xl bg-[var(--color-background)] p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              Audit history
            </p>
            <div className="space-y-3 text-sm text-[var(--color-text-secondary)]">
              {[
                "ROLE_CHANGED — writer access granted",
                "BOOK_APPROVED — The Baobab Kingdom",
                "REPORT_RESOLVED — policy review",
              ].map((entry) => (
                <div
                  key={entry}
                  className="flex items-start gap-2 rounded-lg bg-[var(--color-surface)] p-2"
                >
                  <AlertTriangle
                    size={12}
                    color="var(--color-status-warning)"
                    className="mt-0.5"
                  />
                  <span>{entry}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
