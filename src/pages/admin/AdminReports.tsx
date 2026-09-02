import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, Search, ShieldCheck, UserRound } from "lucide-react";
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

export default function AdminReports({}: CommonProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [status, setStatus] = useState(["ALL", "OPEN", "UNDER_REVIEW", "RESOLVED", "DISMISSED"].includes(searchParams.get("status") ?? "") ? (searchParams.get("status") ?? "ALL") : "ALL");
  const [dialog, setDialog] = useState<{ reportId: string; action: "resolve" | "dismiss" | "review" } | null>(null);

  useEffect(() => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (status !== "ALL") next.set("status", status);
    setSearchParams(next, { replace: true });
  }, [query, status, setSearchParams]);

  const reports = useMemo(() => {
    const all = mockAdminRepository.getReports();
    return all.filter((report) => {
      const matches = !query || `${report.target} ${report.reason}`.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === "ALL" || report.status === status;
      return matches && matchesStatus;
    });
  }, [query, status]);

  const confirmReportAction = () => {
    if (!dialog) return;

    const current = mockAdminRepository.getReports().find((report) => report.id === dialog.reportId);
    if (!current) return;

    if (dialog.action === "resolve") {
      mockAdminRepository.updateReport(dialog.reportId, { status: "RESOLVED", resolution: "Resolved after policy review." });
      mockAdminRepository.createAuditEvent({
        actorId: "admin-ops",
        actorName: "Admin Console",
        action: "REPORT_RESOLVED",
        targetType: "REPORT",
        targetId: dialog.reportId,
        metadata: { resolution: current.reason },
        timestamp: new Date().toISOString(),
      });
    }

    if (dialog.action === "dismiss") {
      mockAdminRepository.updateReport(dialog.reportId, { status: "DISMISSED", resolution: "Dismissed after review—no policy violation found." });
      mockAdminRepository.createAuditEvent({
        actorId: "admin-ops",
        actorName: "Admin Console",
        action: "REPORT_DISMISSED",
        targetType: "REPORT",
        targetId: dialog.reportId,
        metadata: { reason: current.reason },
        timestamp: new Date().toISOString(),
      });
    }

    if (dialog.action === "review") {
      mockAdminRepository.updateReport(dialog.reportId, { status: "UNDER_REVIEW" });
    }

    setDialog(null);
  };

  return (
    <div className="min-h-full bg-[var(--color-background)] px-5 py-8 text-[var(--color-text-primary)]">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Admin Console</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">Reports</h1>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface)] px-4 py-3">
        <Search size={15} color="var(--color-text-muted)" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]" placeholder="Search reports" />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(["ALL", "OPEN", "UNDER_REVIEW", "RESOLVED", "DISMISSED"] as const).map((value) => (
          <button key={value} type="button" onClick={() => setStatus(value)} className="somi-control rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: status === value ? "var(--color-accent-primary)" : "var(--color-surface)", color: status === value ? "var(--color-background)" : "var(--color-text-secondary)" }}>
            {value}
          </button>
        ))}
      </div>

      <div className="space-y-3 pb-8">
        {reports.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-6 text-center text-[var(--color-text-secondary)]">No reports require attention.</div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-[var(--color-text-primary)]">{report.target}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{report.targetType} · reported by {report.reporter}</p>
                </div>
                <StatusBadge label={report.status} tone={reportStatusTone[report.status as keyof typeof reportStatusTone] ?? "neutral"} compact />
              </div>

              <div className="mt-3 text-sm text-[var(--color-text-secondary)]">
                <p className="font-medium text-[var(--color-text-primary)]">{report.reason}</p>
                <p className="mt-1 text-[var(--color-text-secondary)]">{report.description}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <button type="button" onClick={() => setDialog({ reportId: report.id, action: "review" })} className="somi-control flex items-center gap-1 rounded-lg bg-[rgba(96,165,250,0.12)] px-3 py-2 text-[var(--color-accent-primary)]"><ShieldCheck size={12} /> Open</button>
                <button type="button" onClick={() => setDialog({ reportId: report.id, action: "review" })} className="somi-control flex items-center gap-1 rounded-lg bg-[rgba(96,165,250,0.12)] px-3 py-2 text-[var(--color-accent-primary)]"><UserRound size={12} /> Assign</button>
                <button type="button" onClick={() => setDialog({ reportId: report.id, action: "resolve" })} className="somi-control flex items-center gap-1 rounded-lg bg-[rgba(96,165,250,0.12)] px-3 py-2 text-[var(--color-accent-primary)]"><AlertCircle size={12} /> Resolve</button>
                <button type="button" onClick={() => setDialog({ reportId: report.id, action: "dismiss" })} className="somi-control flex items-center gap-1 rounded-lg bg-[rgba(251,113,133,0.12)] px-3 py-2 text-[var(--color-status-danger)]"><AlertCircle size={12} /> Dismiss</button>
              </div>
            </div>
          ))
        )}
      </div>

      <AdminActionDialog
        open={Boolean(dialog)}
        title={dialog?.action === "resolve" ? "Resolve report" : dialog?.action === "dismiss" ? "Dismiss report" : "Review report"}
        description="This action updates the report lifecycle and writes the decision to the review audit trail."
        confirmLabel={dialog?.action === "resolve" ? "Resolve" : dialog?.action === "dismiss" ? "Dismiss" : "Mark under review"}
        variant={dialog?.action === "dismiss" ? "danger" : "default"}
        onConfirm={confirmReportAction}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}
