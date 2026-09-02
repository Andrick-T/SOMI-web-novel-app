import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BookOpen, Coins, Search } from "lucide-react";
import { mockAdminRepository } from "../../features/admin";
import AdminActionDialog from "../../components/AdminActionDialog";
import { StatusBadge } from "../../components/DesignPrimitives";
import type { CommonProps } from "../../types";

const roleColors: Record<string, { bg: string; text: string }> = {
  READER: { bg: "rgba(96,165,250,0.12)", text: "var(--color-accent-primary)" },
  WRITER: { bg: "rgba(74,222,128,0.12)", text: "var(--color-status-success)" },
  ADMIN: { bg: "rgba(167,139,250,0.12)", text: "var(--color-status-info)" },
};

const statusColors: Record<
  string,
  { tone: "success" | "warning" | "danger" | "info" | "neutral"; label: string }
> = {
  ACTIVE: { tone: "success", label: "Active" },
  SUSPENDED: { tone: "danger", label: "Suspended" },
  BANNED: { tone: "danger", label: "Banned" },
  PENDING: { tone: "warning", label: "Pending" },
};

export default function AdminUsers({ navigate }: CommonProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [role, setRole] = useState(
    ["ALL", "READER", "WRITER", "ADMIN"].includes(
      searchParams.get("role") ?? "",
    )
      ? (searchParams.get("role") ?? "ALL")
      : "ALL",
  );
  const [status, setStatus] = useState(
    ["ALL", "ACTIVE", "SUSPENDED", "BANNED", "PENDING"].includes(
      searchParams.get("status") ?? "",
    )
      ? (searchParams.get("status") ?? "ALL")
      : "ALL",
  );
  const [dialog, setDialog] = useState<{
    userId: string;
    action: "role" | "suspend" | "ban" | "restore";
  } | null>(null);

  useEffect(() => {
    const next = new URLSearchParams();
    if (search) next.set("q", search);
    if (role !== "ALL") next.set("role", role);
    if (status !== "ALL") next.set("status", status);
    setSearchParams(next, { replace: true });
  }, [search, role, status, setSearchParams]);

  const users = useMemo(() => {
    const all = mockAdminRepository.getUsers();
    return all.filter((user) => {
      const text = `${user.name} ${user.email}`.toLowerCase();
      const matchesSearch = !search || text.includes(search.toLowerCase());
      const matchesRole = role === "ALL" || user.role === role;
      const matchesStatus = status === "ALL" || user.status === status;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [search, role, status]);

  const confirmUserAction = () => {
    if (!dialog) return;

    const target = mockAdminRepository.getUser(dialog.userId);
    if (!target) return;

    if (dialog.action === "role") {
      const nextRole =
        target.role === "READER"
          ? "WRITER"
          : target.role === "WRITER"
            ? "ADMIN"
            : "READER";

      mockAdminRepository.updateUser(dialog.userId, { role: nextRole });
      mockAdminRepository.createAuditEvent({
        actorId: "admin-ops",
        actorName: "Admin Console",
        action: "ROLE_CHANGED",
        targetType: "USER",
        targetId: dialog.userId,
        metadata: { previousRole: target.role, nextRole },
        timestamp: new Date().toISOString(),
      });
    }

    if (dialog.action === "suspend") {
      mockAdminRepository.updateUser(dialog.userId, {
        status: "SUSPENDED",
        metadata: {
          ...(target.metadata ?? {}),
          suspendedAt: new Date().toISOString(),
        },
      });
      mockAdminRepository.createAuditEvent({
        actorId: "admin-ops",
        actorName: "Admin Console",
        action: "USER_SUSPENDED",
        targetType: "USER",
        targetId: dialog.userId,
        metadata: { reason: "Administrative review" },
        timestamp: new Date().toISOString(),
      });
    }

    if (dialog.action === "ban") {
      mockAdminRepository.updateUser(dialog.userId, {
        status: "BANNED",
        metadata: {
          ...(target.metadata ?? {}),
          bannedAt: new Date().toISOString(),
        },
      });
      mockAdminRepository.createAuditEvent({
        actorId: "admin-ops",
        actorName: "Admin Console",
        action: "USER_BANNED",
        targetType: "USER",
        targetId: dialog.userId,
        metadata: { reason: "Policy violation" },
        timestamp: new Date().toISOString(),
      });
    }

    if (dialog.action === "restore") {
      mockAdminRepository.updateUser(dialog.userId, {
        status: "ACTIVE",
        metadata: {
          ...(target.metadata ?? {}),
          restoredAt: new Date().toISOString(),
        },
      });
      mockAdminRepository.createAuditEvent({
        actorId: "admin-ops",
        actorName: "Admin Console",
        action: "USER_REACTIVATED",
        targetType: "USER",
        targetId: dialog.userId,
        metadata: { reason: "Administrative review complete" },
        timestamp: new Date().toISOString(),
      });
    }

    setDialog(null);
    setStatus("ALL");
  };

  const getActionTitle = (action: string) => {
    const map = {
      role: "Change role",
      suspend: "Suspend account",
      ban: "Ban account",
      restore: "Restore account",
    } as const;
    return map[action as keyof typeof map] ?? "Confirm action";
  };

  return (
    <div className="flex min-h-full flex-col bg-[var(--color-background)] px-5 py-8 text-[var(--color-text-primary)]">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
          Admin Console
        </p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
          Users
        </h1>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          {users.length} total accounts
        </p>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface)] px-4 py-3">
        <Search size={15} color="var(--color-text-muted)" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or email"
          className="w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
        />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(["ALL", "READER", "WRITER", "ADMIN"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRole(value)}
            className="somi-control rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{
              background:
                role === value
                  ? "var(--color-accent-primary)"
                  : "var(--color-surface)",
              color:
                role === value
                  ? "var(--color-background)"
                  : "var(--color-text-secondary)",
            }}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(["ALL", "ACTIVE", "SUSPENDED", "BANNED", "PENDING"] as const).map(
          (value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className="somi-control rounded-lg px-3 py-1.5 text-xs font-semibold"
              style={{
                background:
                  status === value
                    ? "var(--color-accent-primary)"
                    : "var(--color-surface)",
                color:
                  status === value
                    ? "var(--color-background)"
                    : "var(--color-text-secondary)",
              }}
            >
              {value}
            </button>
          ),
        )}
      </div>

      <div className="space-y-3 pb-8">
        {users.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-6 text-center text-[var(--color-text-secondary)]">
            No users match the current filters.
          </div>
        ) : (
          users.map((user) => {
            const roleStyle = roleColors[user.role] ?? {
              bg: "rgba(96,165,250,0.12)",
              text: "var(--color-accent-primary)",
            };
            const statusMeta = statusColors[user.status] ?? {
              tone: "neutral",
              label: user.status,
            };
            return (
              <div
                key={user.id}
                className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold"
                    style={{ background: roleStyle.bg, color: roleStyle.text }}
                  >
                    {user.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[var(--color-text-primary)]">
                        {user.name}
                      </p>
                      <span
                        className="rounded-full px-2 py-1 text-[9px] font-bold"
                        style={{
                          background: roleStyle.bg,
                          color: roleStyle.text,
                        }}
                      >
                        {user.role}
                      </span>
                      <StatusBadge
                        label={statusMeta.label}
                        tone={statusMeta.tone}
                        compact
                      />
                    </div>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      {user.email}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-[var(--color-text-muted)]">
                      <span className="flex items-center gap-1">
                        <Coins size={10} color="var(--color-status-warning)" />{" "}
                        {user.booksPublished} books
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen
                          size={10}
                          color="var(--color-accent-primary)"
                        />{" "}
                        Joined {new Date(user.joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("admin-users", user.id)}
                    className="somi-control rounded-lg bg-[rgba(96,165,250,0.12)] px-3 py-2 text-[10px] font-semibold text-[var(--color-accent-primary)]"
                  >
                    View
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { label: "View profile", action: "view" },
                    { label: "Change role", action: "role" },
                    {
                      label:
                        user.status === "SUSPENDED" ? "Restore" : "Suspend",
                      action:
                        user.status === "SUSPENDED" ? "restore" : "suspend",
                    },
                    {
                      label: user.status === "BANNED" ? "Restore" : "Ban",
                      action: user.status === "BANNED" ? "restore" : "ban",
                    },
                  ].map(({ label, action }) => (
                    <button
                      key={label}
                      type="button"
                      className="somi-control rounded-lg bg-[var(--color-background)] px-2.5 py-2 text-[10px] font-semibold text-[var(--color-text-secondary)]"
                      onClick={() => {
                        if (action === "view") {
                          navigate("admin-users", user.id);
                          return;
                        }
                        setDialog({
                          userId: user.id,
                          action: action as
                            | "role"
                            | "suspend"
                            | "ban"
                            | "restore",
                        });
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <AdminActionDialog
        open={Boolean(dialog)}
        title={dialog ? getActionTitle(dialog.action) : "Confirm action"}
        description={
          dialog
            ? "This action will update the selected account and record an audit event in the admin log."
            : ""
        }
        confirmLabel={
          dialog?.action === "role"
            ? "Apply role change"
            : dialog?.action === "suspend"
              ? "Suspend user"
              : dialog?.action === "ban"
                ? "Ban user"
                : "Restore user"
        }
        variant={dialog?.action === "ban" ? "danger" : "default"}
        onConfirm={confirmUserAction}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}
