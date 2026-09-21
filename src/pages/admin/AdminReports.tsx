import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowRight, Search, ShieldCheck } from "lucide-react";
import { mockAdminRepository } from "../../features/admin";
import AdminActionDialog from "../../components/AdminActionDialog";
import { StatusBadge } from "../../components/DesignPrimitives";
import type { CommonProps } from "../../types";

const reportStatusTone = {
  OPEN: "warning",
  UNDER_REVIEW: "info",
  RESOLVED: "success",
  DISMISSED: "neutral",
} as const;

const reportStatusLabel = {
  OPEN: "Open",
  UNDER_REVIEW: "Under review",
  RESOLVED: "Resolved",
  DISMISSED: "Dismissed",
} as const;

const reportFilters = [
  "ALL",
  "OPEN",
  "UNDER_REVIEW",
  "RESOLVED",
  "DISMISSED",
] as const;

export default function AdminReports({ navigate }: CommonProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const [status, setStatus] = useState(
    reportFilters.includes(
      searchParams.get("status") as (typeof reportFilters)[number],
    )
      ? (searchParams.get("status") as (typeof reportFilters)[number])
      : "ALL",
  );

  const [dialog, setDialog] = useState<{
    reportId: string;
    action: "resolve" | "dismiss" | "review";
  } | null>(null);

  useEffect(() => {
    const next = new URLSearchParams();

    if (query.trim()) {
      next.set("q", query);
    }

    if (status !== "ALL") {
      next.set("status", status);
    }

    setSearchParams(next, { replace: true });
  }, [query, status, setSearchParams]);

  const allReports = useMemo(() => mockAdminRepository.getReports(), []);

  const reports = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return allReports.filter((report) => {
      const matchesQuery =
        !normalizedQuery ||
        `${report.target} ${report.reason} ${report.reporter}`
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesStatus = status === "ALL" || report.status === status;

      return matchesQuery && matchesStatus;
    });
  }, [allReports, query, status]);

  const reportStats = useMemo(
    () => ({
      total: allReports.length,
      open: allReports.filter((report) => report.status === "OPEN").length,
      review: allReports.filter((report) => report.status === "UNDER_REVIEW")
        .length,
      resolved: allReports.filter(
        (report) =>
          report.status === "RESOLVED" || report.status === "DISMISSED",
      ).length,
    }),
    [allReports],
  );

  const confirmReportAction = () => {
    if (!dialog) return;

    const current = mockAdminRepository
      .getReports()
      .find((report) => report.id === dialog.reportId);

    if (!current) {
      setDialog(null);
      return;
    }

    if (dialog.action === "resolve") {
      mockAdminRepository.updateReport(dialog.reportId, {
        status: "RESOLVED",
        resolution: "Resolved after policy review.",
        resolvedBy: "Admin Console",
        resolvedAt: new Date().toISOString(),
      });

      mockAdminRepository.createAuditEvent({
        actorId: "admin-ops",
        actorName: "Admin Console",
        action: "REPORT_RESOLVED",
        targetType: "REPORT",
        targetId: dialog.reportId,
        metadata: {
          resolution: current.reason,
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (dialog.action === "dismiss") {
      mockAdminRepository.updateReport(dialog.reportId, {
        status: "DISMISSED",
        resolution: "Dismissed after review — no policy violation found.",
        resolvedBy: "Admin Console",
        resolvedAt: new Date().toISOString(),
      });

      mockAdminRepository.createAuditEvent({
        actorId: "admin-ops",
        actorName: "Admin Console",
        action: "REPORT_DISMISSED",
        targetType: "REPORT",
        targetId: dialog.reportId,
        metadata: {
          reason: current.reason,
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (dialog.action === "review") {
      mockAdminRepository.updateReport(dialog.reportId, {
        status: "UNDER_REVIEW",
        assignedAdmin: "Admin Console",
      });
    }

    setDialog(null);
  };

  return (
    <main className="somi-admin-page">
      <div className="somi-admin-inner">
        <header className="somi-admin-header">
          <div>
            <p className="somi-admin-eyebrow">Administration</p>

            <h1 className="somi-admin-title">Reports</h1>

            <p className="somi-admin-description">
              Review user reports, moderation concerns, and unresolved platform
              issues.
            </p>
          </div>
        </header>

        <section className="somi-admin-user-summary">
          <div>
            <strong>{reportStats.total}</strong>
            <span>Total reports</span>
          </div>

          <div>
            <strong className="somi-admin-summary-warning">
              {reportStats.open}
            </strong>
            <span>Open</span>
          </div>

          <div>
            <strong>{reportStats.review}</strong>
            <span>Under review</span>
          </div>

          <div>
            <strong>{reportStats.resolved}</strong>
            <span>Closed</span>
          </div>
        </section>

        <section className="somi-admin-toolbar">
          <div className="somi-admin-search">
            <Search size={15} />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search reports, targets, or reporters"
              aria-label="Search reports"
            />
          </div>

          <div className="somi-admin-filter-group">
            {reportFilters.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                className={`somi-admin-filter ${
                  status === value ? "is-active" : ""
                }`}
              >
                {value === "ALL"
                  ? "All reports"
                  : reportStatusLabel[value as keyof typeof reportStatusLabel]}
              </button>
            ))}
          </div>
        </section>

        <section className="somi-admin-data-section">
          <div className="somi-admin-data-header">
            <div>
              <p className="somi-admin-section-eyebrow">Report queue</p>

              <h2 className="somi-admin-section-title">
                {reports.length} matching{" "}
                {reports.length === 1 ? "report" : "reports"}
              </h2>
            </div>
          </div>

          {reports.length === 0 ? (
            <div className="somi-admin-empty-state">
              <AlertCircle size={20} />

              <p>No reports match the current filters.</p>
            </div>
          ) : (
            <div className="somi-admin-report-table">
              <div className="somi-admin-report-table-head">
                <span>Report</span>
                <span>Target</span>
                <span>Reported by</span>
                <span>Status</span>
                <span>Created</span>
                <span />
              </div>

              {reports.map((report) => (
                <div key={report.id} className="somi-admin-report-row">
                  <div className="somi-admin-report-identity">
                    <div className="somi-admin-report-icon">
                      <AlertCircle size={15} />
                    </div>

                    <div className="somi-admin-user-name">
                      <strong>{report.reason}</strong>

                      <span>{report.description}</span>
                    </div>
                  </div>

                  <div className="somi-admin-report-target">
                    <strong>{report.target}</strong>

                    <span>{report.targetType}</span>
                  </div>

                  <span className="somi-admin-content-meta">
                    {report.reporter}
                  </span>

                  <StatusBadge
                    label={reportStatusLabel[report.status]}
                    tone={reportStatusTone[report.status]}
                    compact
                  />

                  <span className="somi-admin-content-date">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>

                  <div className="somi-admin-report-actions">
                    {report.status === "OPEN" && (
                      <button
                        type="button"
                        onClick={() =>
                          setDialog({
                            reportId: report.id,
                            action: "review",
                          })
                        }
                        className="somi-admin-row-action-secondary"
                      >
                        <ShieldCheck size={12} />
                        Review
                      </button>
                    )}

                    {(report.status === "OPEN" ||
                      report.status === "UNDER_REVIEW") && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setDialog({
                              reportId: report.id,
                              action: "resolve",
                            })
                          }
                          className="somi-admin-row-action"
                        >
                          Resolve
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setDialog({
                              reportId: report.id,
                              action: "dismiss",
                            })
                          }
                          className="somi-admin-row-action-danger"
                        >
                          Dismiss
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          report.targetType === "USER"
                            ? "admin-users"
                            : "admin-content",
                          report.targetId,
                        )
                      }
                      className="somi-admin-row-action-secondary"
                    >
                      Open
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <AdminActionDialog
        open={Boolean(dialog)}
        title={
          dialog?.action === "resolve"
            ? "Resolve report"
            : dialog?.action === "dismiss"
              ? "Dismiss report"
              : "Review report"
        }
        description="This action updates the report lifecycle and records the moderation decision."
        confirmLabel={
          dialog?.action === "resolve"
            ? "Resolve"
            : dialog?.action === "dismiss"
              ? "Dismiss"
              : "Mark under review"
        }
        variant={dialog?.action === "dismiss" ? "danger" : "default"}
        onConfirm={confirmReportAction}
        onCancel={() => setDialog(null)}
      />
    </main>
  );
}
