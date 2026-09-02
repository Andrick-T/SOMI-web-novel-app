import { useMemo, useState } from "react";
import { BookOpen, Search, TrendingUp, Users } from "lucide-react";
import { mockAdminRepository } from "../../features/admin";
import { StatusBadge } from "../../components/DesignPrimitives";
import type { CommonProps } from "../../types";

const writerStatusColors: Record<
  string,
  { tone: "success" | "warning" | "danger" | "info" | "neutral"; label: string }
> = {
  ACTIVE: { tone: "success", label: "Active" },
  PENDING: { tone: "warning", label: "Pending" },
  SUSPENDED: { tone: "danger", label: "Suspended" },
};

export default function AdminWriters({ navigate }: CommonProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");

  const writers = useMemo(() => {
    const all = mockAdminRepository
      .getUsers()
      .filter((user) => user.role === "WRITER");
    return all.filter((writer) => {
      const matchesQuery =
        !query ||
        `${writer.name} ${writer.email}`
          .toLowerCase()
          .includes(query.toLowerCase());
      const matchesStatus = status === "ALL" || writer.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, status]);

  return (
    <div className="min-h-full bg-[var(--color-background)] px-5 py-8 text-[var(--color-text-primary)]">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
          Admin Console
        </p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
          Writers
        </h1>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface)] px-4 py-3">
        <Search size={15} color="var(--color-text-muted)" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search writers by name or email"
          className="w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
        />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(["ALL", "ACTIVE", "PENDING", "SUSPENDED"] as const).map((value) => (
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
        ))}
      </div>

      <div className="space-y-3 pb-8">
        {writers.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-6 text-center text-[var(--color-text-secondary)]">
            No writers match the current filters.
          </div>
        ) : (
          writers.map((writer) => {
            const statusMeta =
              writerStatusColors[writer.status] ?? writerStatusColors.ACTIVE;
            return (
              <div
                key={writer.id}
                className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(74,222,128,0.12)] text-sm font-bold text-[var(--color-status-success)]">
                      {writer.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--color-text-primary)]">
                        {writer.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {writer.email}
                      </p>
                    </div>
                  </div>
                  <StatusBadge
                    label={statusMeta.label}
                    tone={statusMeta.tone}
                    compact
                  />
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-xl bg-[var(--color-background)] p-3">
                    <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                      <BookOpen size={12} color="var(--color-accent-primary)" />{" "}
                      <span className="text-[10px] uppercase tracking-[0.18em]">
                        Books
                      </span>
                    </div>
                    <p className="mt-2 text-xl font-bold text-[var(--color-text-primary)]">
                      {writer.booksPublished}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[var(--color-background)] p-3">
                    <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                      <Users size={12} color="var(--color-accent-primary)" />{" "}
                      <span className="text-[10px] uppercase tracking-[0.18em]">
                        Reads
                      </span>
                    </div>
                    <p className="mt-2 text-xl font-bold text-[var(--color-text-primary)]">
                      {Math.max(writer.booksPublished * 42, 210)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[var(--color-background)] p-3">
                    <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                      <TrendingUp
                        size={12}
                        color="var(--color-accent-primary)"
                      />{" "}
                      <span className="text-[10px] uppercase tracking-[0.18em]">
                        Earnings
                      </span>
                    </div>
                    <p className="mt-2 text-xl font-bold text-[var(--color-text-primary)]">
                      ${(writer.booksPublished * 180).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("admin-users", writer.id)}
                    className="somi-control rounded-lg bg-[rgba(96,165,250,0.12)] px-3 py-2 text-[10px] font-semibold text-[var(--color-accent-primary)]"
                  >
                    View profile
                  </button>
                  <button
                    type="button"
                    className="somi-control rounded-lg bg-[var(--color-background)] px-3 py-2 text-[10px] font-semibold text-[var(--color-text-secondary)]"
                  >
                    Manage status
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
