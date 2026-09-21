import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  Search,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { mockAdminRepository } from "../../features/admin/repository.ts";
import type { AuditAction, AuditEvent } from "../../features/admin/types";

const SENSITIVE_ACTIONS: AuditAction[] = [
  "USER_SUSPENDED",
  "USER_REACTIVATED",
  "USER_BANNED",
  "ROLE_CHANGED",
  "WALLET_ADJUSTED",
  "SETTING_CHANGED",
];

const ACTION_LABELS: Record<string, string> = {
  USER_SUSPENDED: "User suspended",
  USER_REACTIVATED: "User reactivated",
  USER_BANNED: "User banned",
  ROLE_CHANGED: "Role changed",
  BOOK_APPROVED: "Book approved",
  BOOK_REJECTED: "Book rejected",
  BOOK_UNPUBLISHED: "Book unpublished",
  REPORT_RESOLVED: "Report resolved",
  REPORT_DISMISSED: "Report dismissed",
  WALLET_ADJUSTED: "Wallet adjusted",
  SETTING_CHANGED: "Setting changed",
};

function formatAction(action: string) {
  return (
    ACTION_LABELS[action] ??
    action
      .split("_")
      .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
      .join(" ")
  );
}

function formatTargetType(targetType: string) {
  return targetType
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(timestamp: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function formatMetadata(metadata: Record<string, unknown>) {
  const entries = Object.entries(metadata);

  if (!entries.length) {
    return null;
  }

  return entries.map(([key, value]) => {
    let displayValue = "";

    if (typeof value === "string") {
      displayValue = value;
    } else if (typeof value === "number" || typeof value === "boolean") {
      displayValue = String(value);
    } else {
      try {
        displayValue = JSON.stringify(value);
      } catch {
        displayValue = String(value);
      }
    }

    return {
      key: key
        .split(/[_-]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
      value: displayValue,
    };
  });
}

function actionTone(action: string) {
  if (
    action === "BOOK_APPROVED" ||
    action === "REPORT_RESOLVED" ||
    action === "USER_REACTIVATED"
  ) {
    return "success";
  }

  if (
    action === "BOOK_REJECTED" ||
    action === "BOOK_UNPUBLISHED" ||
    action === "REPORT_DISMISSED"
  ) {
    return "warning";
  }

  if (SENSITIVE_ACTIONS.includes(action as AuditAction)) {
    return "danger";
  }

  return "neutral";
}

function eventIcon(action: string) {
  if (SENSITIVE_ACTIONS.includes(action as AuditAction)) {
    return <ShieldAlert size={16} />;
  }

  if (
    action === "BOOK_APPROVED" ||
    action === "BOOK_REJECTED" ||
    action === "BOOK_UNPUBLISHED"
  ) {
    return <FileText size={16} />;
  }

  if (action === "REPORT_RESOLVED" || action === "REPORT_DISMISSED") {
    return <CheckCircle2 size={16} />;
  }

  return <Activity size={16} />;
}

export default function AdminAudit() {
  const [events] = useState<AuditEvent[]>(() =>
    mockAdminRepository.getAuditEvents(),
  );
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [targetFilter, setTargetFilter] = useState("ALL");

  const actionOptions = useMemo(
    () =>
      Array.from(new Set(events.map((event) => event.action))).sort((a, b) =>
        formatAction(a).localeCompare(formatAction(b)),
      ),
    [events],
  );

  const targetOptions = useMemo(
    () => Array.from(new Set(events.map((event) => event.targetType))).sort(),
    [events],
  );

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return events
      .filter((event) => {
        const metadataText = Object.entries(event.metadata ?? {})
          .map(([key, value]) => `${key} ${String(value)}`)
          .join(" ");

        const searchableText = [
          event.id,
          event.actorId,
          event.actorName,
          event.action,
          event.targetType,
          event.targetId,
          metadataText,
        ]
          .join(" ")
          .toLowerCase();

        const matchesQuery =
          !normalizedQuery || searchableText.includes(normalizedQuery);

        const matchesAction =
          actionFilter === "ALL" || event.action === actionFilter;

        const matchesTarget =
          targetFilter === "ALL" || event.targetType === targetFilter;

        return matchesQuery && matchesAction && matchesTarget;
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  }, [events, query, actionFilter, targetFilter]);

  const sensitiveCount = useMemo(
    () =>
      events.filter((event) =>
        SENSITIVE_ACTIONS.includes(event.action as AuditAction),
      ).length,
    [events],
  );

  const uniqueActors = useMemo(
    () => new Set(events.map((event) => event.actorId)).size,
    [events],
  );

  const latestEvent = filteredEvents[0];

  return (
    <div className="somi-admin-page somi-admin-audit-page">
      <div className="somi-admin-inner">
        <header className="somi-admin-header">
          <div>
            <p className="somi-admin-eyebrow">Governance</p>
            <h1 className="somi-admin-title">Audit log</h1>
            <p className="somi-admin-description">
              Review the administrative actions recorded across the platform.
              Sensitive changes are highlighted for faster operational review.
            </p>
          </div>
        </header>

        <div className="somi-admin-audit-summary">
          <div className="somi-admin-audit-summary-item">
            <div className="somi-admin-audit-summary-icon">
              <Activity size={17} />
            </div>
            <div>
              <span>Total events</span>
              <strong>{events.length}</strong>
            </div>
          </div>

          <div className="somi-admin-audit-summary-item">
            <div className="somi-admin-audit-summary-icon somi-admin-audit-icon-danger">
              <ShieldAlert size={17} />
            </div>
            <div>
              <span>Sensitive events</span>
              <strong>{sensitiveCount}</strong>
            </div>
          </div>

          <div className="somi-admin-audit-summary-item">
            <div className="somi-admin-audit-summary-icon">
              <UserRound size={17} />
            </div>
            <div>
              <span>Administrative actors</span>
              <strong>{uniqueActors}</strong>
            </div>
          </div>

          <div className="somi-admin-audit-summary-item">
            <div className="somi-admin-audit-summary-icon">
              <Clock3 size={17} />
            </div>
            <div>
              <span>Latest recorded event</span>
              <strong>
                {latestEvent ? formatDate(latestEvent.timestamp) : "No events"}
              </strong>
            </div>
          </div>
        </div>

        <div className="somi-admin-audit-notice">
          <ShieldAlert size={17} />
          <div>
            <strong>Read-only operational record</strong>
            <span>
              Audit entries document administrative activity and are not
              editable from this interface.
            </span>
          </div>
        </div>

        <section className="somi-admin-audit-toolbar">
          <div className="somi-admin-audit-search">
            <Search size={16} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search actor, action, target or metadata..."
              aria-label="Search audit events"
            />
          </div>

          <label className="somi-admin-audit-filter">
            <span>Action</span>
            <select
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
            >
              <option value="ALL">All actions</option>
              {actionOptions.map((action) => (
                <option key={action} value={action}>
                  {formatAction(action)}
                </option>
              ))}
            </select>
          </label>

          <label className="somi-admin-audit-filter">
            <span>Target</span>
            <select
              value={targetFilter}
              onChange={(event) => setTargetFilter(event.target.value)}
            >
              <option value="ALL">All targets</option>
              {targetOptions.map((target) => (
                <option key={target} value={target}>
                  {formatTargetType(target)}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="somi-admin-audit-results">
          <div className="somi-admin-audit-results-header">
            <div>
              <p className="somi-admin-eyebrow">Activity record</p>
              <h2 className="somi-admin-audit-results-title">
                {filteredEvents.length}{" "}
                {filteredEvents.length === 1 ? "event" : "events"}
              </h2>
            </div>

            {(query || actionFilter !== "ALL" || targetFilter !== "ALL") && (
              <button
                type="button"
                className="somi-admin-button somi-admin-button-secondary"
                onClick={() => {
                  setQuery("");
                  setActionFilter("ALL");
                  setTargetFilter("ALL");
                }}
              >
                Clear filters
              </button>
            )}
          </div>

          {filteredEvents.length === 0 ? (
            <div className="somi-admin-audit-empty">
              <Search size={22} />
              <strong>No audit events found</strong>
              <span>
                Try changing the search term or removing one of the filters.
              </span>
            </div>
          ) : (
            <div className="somi-admin-audit-list">
              {filteredEvents.map((event) => {
                const sensitive = SENSITIVE_ACTIONS.includes(
                  event.action as AuditAction,
                );
                const metadata = formatMetadata(event.metadata ?? {});
                const tone = actionTone(event.action);

                return (
                  <article
                    key={event.id}
                    className={`somi-admin-audit-event ${
                      sensitive ? "is-sensitive" : ""
                    }`}
                  >
                    <div className={`somi-admin-audit-event-icon tone-${tone}`}>
                      {eventIcon(event.action)}
                    </div>

                    <div className="somi-admin-audit-event-main">
                      <div className="somi-admin-audit-event-top">
                        <div className="somi-admin-audit-event-heading">
                          <span
                            className={`somi-admin-audit-action tone-${tone}`}
                          >
                            {formatAction(event.action)}
                          </span>

                          {sensitive && (
                            <span className="somi-admin-audit-sensitive">
                              Sensitive
                            </span>
                          )}
                        </div>

                        <time
                          className="somi-admin-audit-time"
                          dateTime={event.timestamp}
                        >
                          {formatDate(event.timestamp)}
                        </time>
                      </div>

                      <div className="somi-admin-audit-event-context">
                        <span>
                          <strong>{event.actorName}</strong> performed this
                          action on a{" "}
                          <strong>{formatTargetType(event.targetType)}</strong>
                        </span>

                        <span className="somi-admin-audit-target">
                          Target: {event.targetId}
                        </span>
                      </div>

                      {metadata && metadata.length > 0 && (
                        <div className="somi-admin-audit-metadata">
                          {metadata.map((item) => (
                            <div
                              key={`${event.id}-${item.key}`}
                              className="somi-admin-audit-metadata-item"
                            >
                              <span>{item.key}</span>
                              <strong>{item.value}</strong>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="somi-admin-audit-event-footer">
                        <span>Actor ID: {event.actorId}</span>
                        <span>Event ID: {event.id}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
