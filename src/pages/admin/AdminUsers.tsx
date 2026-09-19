import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { mockAdminRepository } from "../../features/admin";
import AdminActionDialog from "../../components/AdminActionDialog";
import type { CommonProps } from "../../types";

const roleMeta: Record<string, { label: string; className: string }> = {
  READER: {
    label: "Reader",
    className: "somi-admin-user-role-reader",
  },
  WRITER: {
    label: "Writer",
    className: "somi-admin-user-role-writer",
  },
  ADMIN: {
    label: "Admin",
    className: "somi-admin-user-role-admin",
  },
};

const statusMeta: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: "Active",
    className: "somi-admin-status-active",
  },
  SUSPENDED: {
    label: "Suspended",
    className: "somi-admin-status-danger",
  },
  BANNED: {
    label: "Banned",
    className: "somi-admin-status-danger",
  },
  PENDING: {
    label: "Pending",
    className: "somi-admin-status-warning",
  },
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

  const counts = useMemo(() => {
    const all = mockAdminRepository.getUsers();

    return {
      total: all.length,
      readers: all.filter((user) => user.role === "READER").length,
      writers: all.filter((user) => user.role === "WRITER").length,
      admins: all.filter((user) => user.role === "ADMIN").length,
      pending: all.filter((user) => user.status === "PENDING").length,
    };
  }, [users]);

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

      mockAdminRepository.updateUser(dialog.userId, {
        role: nextRole,
      });

      mockAdminRepository.createAuditEvent({
        actorId: "admin-ops",
        actorName: "Admin Console",
        action: "ROLE_CHANGED",
        targetType: "USER",
        targetId: dialog.userId,
        metadata: {
          previousRole: target.role,
          nextRole,
        },
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
        metadata: {
          reason: "Administrative review",
        },
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
        metadata: {
          reason: "Policy violation",
        },
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
        metadata: {
          reason: "Administrative review complete",
        },
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
    <main className="somi-admin-page">
      <div className="somi-admin-inner">
        <header className="somi-admin-header">
          <div>
            <p className="somi-admin-eyebrow">Administration</p>

            <h1 className="somi-admin-title">Users</h1>

            <p className="somi-admin-description">
              Manage reader, writer, and administrator accounts across SOMI.
            </p>
          </div>
        </header>

        <section className="somi-admin-user-summary">
          <div>
            <strong>{counts.total}</strong>
            <span>Total accounts</span>
          </div>

          <div>
            <strong>{counts.readers}</strong>
            <span>Readers</span>
          </div>

          <div>
            <strong>{counts.writers}</strong>
            <span>Writers</span>
          </div>

          <div>
            <strong>{counts.admins}</strong>
            <span>Admins</span>
          </div>

          <div>
            <strong className="somi-admin-summary-warning">
              {counts.pending}
            </strong>
            <span>Pending</span>
          </div>
        </section>

        <section className="somi-admin-toolbar">
          <div className="somi-admin-search">
            <Search size={15} />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email"
              aria-label="Search users"
            />
          </div>

          <div className="somi-admin-filter-group">
            {(["ALL", "READER", "WRITER", "ADMIN"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={`somi-admin-filter ${
                  role === value ? "is-active" : ""
                }`}
              >
                {value === "ALL"
                  ? "All roles"
                  : (roleMeta[value]?.label ?? value)}
              </button>
            ))}
          </div>

          <div className="somi-admin-filter-group">
            {(["ALL", "ACTIVE", "PENDING", "SUSPENDED", "BANNED"] as const).map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatus(value)}
                  className={`somi-admin-filter ${
                    status === value ? "is-active" : ""
                  }`}
                >
                  {value === "ALL"
                    ? "All status"
                    : (statusMeta[value]?.label ?? value)}
                </button>
              ),
            )}
          </div>
        </section>

        <section className="somi-admin-data-section">
          <div className="somi-admin-data-header">
            <div>
              <p className="somi-admin-section-eyebrow">Account directory</p>

              <h2 className="somi-admin-section-title">
                {users.length} matching{" "}
                {users.length === 1 ? "account" : "accounts"}
              </h2>
            </div>
          </div>

          {users.length === 0 ? (
            <div className="somi-admin-empty-state">
              <UserRound size={20} />
              <p>No users match the current filters.</p>
            </div>
          ) : (
            <div className="somi-admin-user-table">
              <div className="somi-admin-user-table-head">
                <span>User</span>
                <span>Role</span>
                <span>Status</span>
                <span>Books</span>
                <span>Last active</span>
                <span />
              </div>

              {users.map((user) => {
                const role = roleMeta[user.role] ?? roleMeta.READER;
                const statusInfo = statusMeta[user.status] ?? statusMeta.ACTIVE;

                return (
                  <div key={user.id} className="somi-admin-user-row">
                    <div className="somi-admin-user-identity">
                      <div className="somi-admin-user-avatar">
                        {user.avatar}
                      </div>

                      <div className="somi-admin-user-name">
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                      </div>
                    </div>

                    <span className={`somi-admin-user-role ${role.className}`}>
                      {role.label}
                    </span>

                    <span
                      className={`somi-admin-user-status ${statusInfo.className}`}
                    >
                      <span />
                      {statusInfo.label}
                    </span>

                    <span className="somi-admin-user-metric">
                      {user.booksPublished > 0 ? (
                        <>
                          <BookOpen size={13} />
                          {user.booksPublished}
                        </>
                      ) : (
                        "—"
                      )}
                    </span>

                    <span className="somi-admin-user-date">
                      {user.lastActiveAt
                        ? new Date(user.lastActiveAt).toLocaleDateString()
                        : "—"}
                    </span>

                    <div className="somi-admin-user-actions">
                      <button
                        type="button"
                        onClick={() => navigate("admin-users", user.id)}
                        className="somi-admin-row-action"
                      >
                        View
                        <ArrowRight size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDialog({
                            userId: user.id,
                            action: "role",
                          })
                        }
                        className="somi-admin-row-action-secondary"
                      >
                        Role
                      </button>

                      {user.status === "SUSPENDED" ? (
                        <button
                          type="button"
                          onClick={() =>
                            setDialog({
                              userId: user.id,
                              action: "restore",
                            })
                          }
                          className="somi-admin-row-action-secondary"
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setDialog({
                              userId: user.id,
                              action: "suspend",
                            })
                          }
                          className="somi-admin-row-action-secondary"
                        >
                          Suspend
                        </button>
                      )}

                      {user.status === "BANNED" ? (
                        <button
                          type="button"
                          onClick={() =>
                            setDialog({
                              userId: user.id,
                              action: "restore",
                            })
                          }
                          className="somi-admin-row-action-secondary"
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setDialog({
                              userId: user.id,
                              action: "ban",
                            })
                          }
                          className="somi-admin-row-action-danger"
                        >
                          Ban
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

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
    </main>
  );
}
