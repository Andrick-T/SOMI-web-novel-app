import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FileText, Search } from "lucide-react";
import { mockAdminRepository } from "../../features/admin";
import { StatusBadge } from "../../components/DesignPrimitives";
import type { CommonProps } from "../../types";

export default function AdminAudit({}: CommonProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [action, setAction] = useState(searchParams.get("action") ?? "ALL");

  useEffect(() => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (action !== "ALL") next.set("action", action);
    setSearchParams(next, { replace: true });
  }, [query, action, setSearchParams]);

  const events = useMemo(() => {
    const all = [...mockAdminRepository.getAuditEvents()].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    return all.filter((event) => {
      const text = `${event.action} ${event.actorName} ${event.targetType} ${event.targetId}`.toLowerCase();
      const matchesQuery = !query || text.includes(query.toLowerCase());
      const matchesAction = action === "ALL" || event.action === action;
      return matchesQuery && matchesAction;
    });
  }, [query, action]);

  return (
    <div className="min-h-full bg-[var(--color-background)] px-5 py-8 text-[var(--color-text-primary)]">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Admin Console</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">Audit Log</h1>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface)] px-4 py-3">
        <Search size={15} color="var(--color-text-muted)" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search actions, actors, IDs"
          aria-label="Search audit log"
          className="w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
        />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(["ALL", "BOOK_APPROVED", "USER_SUSPENDED", "REPORT_RESOLVED", "ROLE_CHANGED", "SETTING_CHANGED"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setAction(value)}
            className="somi-control rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{
              background: action === value ? "var(--color-accent-primary)" : "var(--color-surface)",
              color: action === value ? "var(--color-background)" : "var(--color-text-secondary)",
            }}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="space-y-3 pb-8">
        {events.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-6 text-center text-[var(--color-text-secondary)]">
            No audit entries match the current filters.
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="flex items-start gap-3 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(96,165,250,0.12)] text-[var(--color-accent-primary)]">
                <FileText size={15} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-[var(--color-text-primary)]">{event.action}</p>
                  <StatusBadge label={event.targetType} tone="info" compact />
                </div>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Actor: {event.actorName}</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">{event.targetId} · {new Date(event.timestamp).toLocaleString()}</p>
                {event.metadata && Object.keys(event.metadata).length > 0 && (
                  <p className="mt-2 text-[11px] text-[var(--color-text-secondary)]">Details: {JSON.stringify(event.metadata)}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
