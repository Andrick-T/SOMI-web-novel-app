import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, Search } from "lucide-react";
import { mockAdminRepository } from "../../features/admin";
import type { CommonProps } from "../../types";

const writerStatusMeta: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: "Active",
    className: "somi-admin-status-active",
  },
  PENDING: {
    label: "Pending",
    className: "somi-admin-status-warning",
  },
  SUSPENDED: {
    label: "Suspended",
    className: "somi-admin-status-danger",
  },
};

export default function AdminWriters({ navigate }: CommonProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");

  const allWriters = useMemo(
    () =>
      mockAdminRepository.getUsers().filter((user) => user.role === "WRITER"),
    [],
  );

  const writers = useMemo(() => {
    return allWriters.filter((writer) => {
      const normalizedQuery = query.trim().toLowerCase();

      const matchesQuery =
        !normalizedQuery ||
        `${writer.name} ${writer.email}`
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesStatus = status === "ALL" || writer.status === status;

      return matchesQuery && matchesStatus;
    });
  }, [allWriters, query, status]);

  const writerStats = useMemo(
    () => ({
      total: allWriters.length,
      active: allWriters.filter((writer) => writer.status === "ACTIVE").length,
      pending: allWriters.filter((writer) => writer.status === "PENDING")
        .length,
      suspended: allWriters.filter((writer) => writer.status === "SUSPENDED")
        .length,
    }),
    [allWriters],
  );

  return (
    <main className="somi-admin-page">
      <div className="somi-admin-inner">
        <header className="somi-admin-header">
          <div>
            <p className="somi-admin-eyebrow">Administration</p>

            <h1 className="somi-admin-title">Writers</h1>

            <p className="somi-admin-description">
              Review writer accounts, publishing activity, and account status.
            </p>
          </div>
        </header>

        <section className="somi-admin-user-summary">
          <div>
            <strong>{writerStats.total}</strong>
            <span>Total writers</span>
          </div>

          <div>
            <strong>{writerStats.active}</strong>
            <span>Active</span>
          </div>

          <div>
            <strong className="somi-admin-summary-warning">
              {writerStats.pending}
            </strong>
            <span>Pending</span>
          </div>

          <div>
            <strong className="somi-admin-summary-danger">
              {writerStats.suspended}
            </strong>
            <span>Suspended</span>
          </div>
        </section>

        <section className="somi-admin-toolbar">
          <div className="somi-admin-search">
            <Search size={15} />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search writers by name or email"
              aria-label="Search writers"
            />
          </div>

          <div className="somi-admin-filter-group">
            {(["ALL", "ACTIVE", "PENDING", "SUSPENDED"] as const).map(
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
                    ? "All writers"
                    : (writerStatusMeta[value]?.label ?? value)}
                </button>
              ),
            )}
          </div>
        </section>

        <section className="somi-admin-data-section">
          <div className="somi-admin-data-header">
            <div>
              <p className="somi-admin-section-eyebrow">Writer directory</p>

              <h2 className="somi-admin-section-title">
                {writers.length} matching{" "}
                {writers.length === 1 ? "writer" : "writers"}
              </h2>
            </div>
          </div>

          {writers.length === 0 ? (
            <div className="somi-admin-empty-state">
              <BookOpen size={20} />

              <p>No writers match the current filters.</p>
            </div>
          ) : (
            <div className="somi-admin-writer-table">
              <div className="somi-admin-writer-table-head">
                <span>Writer</span>
                <span>Status</span>
                <span>Books</span>
                <span>Joined</span>
                <span>Last active</span>
                <span />
              </div>

              {writers.map((writer) => {
                const statusInfo =
                  writerStatusMeta[writer.status] ?? writerStatusMeta.ACTIVE;

                const joinedDate = writer.joinedAt ?? writer.createdAt;

                return (
                  <div key={writer.id} className="somi-admin-writer-row">
                    <div className="somi-admin-user-identity">
                      <div className="somi-admin-writer-avatar">
                        {writer.avatar}
                      </div>

                      <div className="somi-admin-user-name">
                        <strong>{writer.name}</strong>

                        <span>{writer.email}</span>
                      </div>
                    </div>

                    <span
                      className={`somi-admin-user-status ${statusInfo.className}`}
                    >
                      <span />
                      {statusInfo.label}
                    </span>

                    <span className="somi-admin-writer-metric">
                      <BookOpen size={13} />
                      {writer.booksPublished}
                    </span>

                    <span className="somi-admin-writer-date">{joinedDate}</span>

                    <span className="somi-admin-writer-date">
                      {writer.lastActiveAt}
                    </span>

                    <div className="somi-admin-writer-actions">
                      <button
                        type="button"
                        onClick={() => navigate("admin-users", writer.id)}
                        className="somi-admin-row-action"
                      >
                        View profile
                        <ArrowRight size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate("admin-users", writer.id)}
                        className="somi-admin-row-action-secondary"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
