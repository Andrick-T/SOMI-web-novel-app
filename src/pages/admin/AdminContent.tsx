import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BookOpen, Search, ShieldAlert } from "lucide-react";
import { mockAdminRepository } from "../../features/admin";
import AdminActionDialog from "../../components/AdminActionDialog";
import { StatusBadge } from "../../components/DesignPrimitives";
import type { CommonProps } from "../../types";

const statusConfig: Record<
  string,
  { label: string; tone: "success" | "warning" | "danger" | "info" | "neutral" }
> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  EDITING: { label: "Editing", tone: "warning" },
  READY_FOR_REVIEW: { label: "Ready for review", tone: "info" },
  SCHEDULED: { label: "Scheduled", tone: "info" },
  PUBLISHED: { label: "Published", tone: "success" },
  REJECTED: { label: "Rejected", tone: "danger" },
  UNPUBLISHED: { label: "Unpublished", tone: "neutral" },
  ARCHIVED: { label: "Archived", tone: "neutral" },
};

export default function AdminContent({ navigate }: CommonProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [status, setStatus] = useState(
    [
      "ALL",
      "DRAFT",
      "EDITING",
      "READY_FOR_REVIEW",
      "PUBLISHED",
      "REJECTED",
      "UNPUBLISHED",
      "ARCHIVED",
    ].includes(searchParams.get("status") ?? "")
      ? (searchParams.get("status") ?? "ALL")
      : "ALL",
  );
  const [dialog, setDialog] = useState<{
    bookId: string;
    action: "approve" | "reject" | "changes" | "unpublish";
  } | null>(null);

  useEffect(() => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (status !== "ALL") next.set("status", status);
    setSearchParams(next, { replace: true });
  }, [query, status, setSearchParams]);

  const books = useMemo(() => {
    const all = mockAdminRepository.getBooks();
    return all.filter((item) => {
      const text = `${item.title} ${item.writer}`.toLowerCase();
      const matchesQuery = !query || text.includes(query.toLowerCase());
      const matchesStatus = status === "ALL" || item.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, status]);

  const confirmBookAction = () => {
    if (!dialog) return;

    const current = mockAdminRepository.getBook(dialog.bookId);
    if (!current) return;

    if (dialog.action === "approve") {
      mockAdminRepository.updateBook(dialog.bookId, {
        status: "PUBLISHED",
        moderationStatus: "APPROVED",
        metadata: {
          ...(current.metadata ?? {}),
          approvedAt: new Date().toISOString(),
        },
      });
    }

    if (dialog.action === "reject") {
      mockAdminRepository.updateBook(dialog.bookId, {
        status: "REJECTED",
        moderationStatus: "REJECTED",
        metadata: {
          ...(current.metadata ?? {}),
          rejectionReason: "Policy review",
        },
      });
    }

    if (dialog.action === "changes") {
      mockAdminRepository.updateBook(dialog.bookId, {
        status: "EDITING",
        moderationStatus: "CHANGES_REQUESTED",
        metadata: {
          ...(current.metadata ?? {}),
          feedback: "Requires revision before publication.",
        },
      });
    }

    if (dialog.action === "unpublish") {
      mockAdminRepository.updateBook(dialog.bookId, {
        status: "UNPUBLISHED",
        moderationStatus: "REJECTED",
        metadata: {
          ...(current.metadata ?? {}),
          unpublishReason: "Removed for policy review.",
        },
      });
    }

    mockAdminRepository.createAuditEvent({
      actorId: "admin-ops",
      actorName: "Admin Console",
      action:
        dialog.action === "approve"
          ? "BOOK_APPROVED"
          : dialog.action === "reject"
            ? "BOOK_REJECTED"
            : dialog.action === "changes"
              ? "BOOK_REJECTED"
              : "BOOK_UNPUBLISHED",
      targetType: "BOOK",
      targetId: dialog.bookId,
      metadata: { action: dialog.action },
      timestamp: new Date().toISOString(),
    });

    setDialog(null);
  };

  return (
    <div className="flex min-h-full flex-col bg-[var(--color-background)] px-5 py-8 text-[var(--color-text-primary)]">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
          Admin Console
        </p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
          Content
        </h1>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface)] px-4 py-3">
        <Search size={15} color="var(--color-text-muted)" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search titles or writers"
          className="w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
        />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(
          [
            "ALL",
            "DRAFT",
            "EDITING",
            "READY_FOR_REVIEW",
            "PUBLISHED",
            "REJECTED",
            "UNPUBLISHED",
            "ARCHIVED",
          ] as const
        ).map((value) => (
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
        {books.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-6 text-center text-[var(--color-text-secondary)]">
            No content matches these filters.
          </div>
        ) : (
          books.map((book) => {
            const statusBadge = statusConfig[book.status] ?? statusConfig.DRAFT;
            return (
              <div
                key={book.id}
                className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(96,165,250,0.12)] text-[var(--color-accent-primary)]">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-[var(--color-text-primary)]">
                        {book.title}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        by {book.writer}
                      </p>
                    </div>
                  </div>
                  <StatusBadge
                    label={statusBadge.label}
                    tone={statusBadge.tone}
                    compact
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-[var(--color-text-muted)]">
                  <span>{book.genre}</span>
                  <span>{book.chapters} chapters</span>
                  <span>{book.moderationStatus}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("admin-content", book.id)}
                    className="somi-control rounded-lg bg-[rgba(96,165,250,0.12)] px-3 py-2 text-[10px] font-semibold text-[var(--color-accent-primary)]"
                  >
                    Review
                  </button>
                  {book.status !== "PUBLISHED" && (
                    <button
                      type="button"
                      onClick={() =>
                        setDialog({ bookId: book.id, action: "approve" })
                      }
                      className="somi-control rounded-lg bg-[rgba(74,222,128,0.12)] px-3 py-2 text-[10px] font-semibold text-[var(--color-status-success)]"
                    >
                      Approve
                    </button>
                  )}
                  {book.status !== "REJECTED" && (
                    <button
                      type="button"
                      onClick={() =>
                        setDialog({ bookId: book.id, action: "reject" })
                      }
                      className="somi-control rounded-lg bg-[rgba(251,113,133,0.12)] px-3 py-2 text-[10px] font-semibold text-[var(--color-status-danger)]"
                    >
                      Reject
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setDialog({ bookId: book.id, action: "changes" })
                    }
                    className="somi-control flex items-center gap-1 rounded-lg bg-[var(--color-background)] px-3 py-2 text-[10px] font-semibold text-[var(--color-text-secondary)]"
                  >
                    <ShieldAlert size={11} />
                    Request changes
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDialog({ bookId: book.id, action: "unpublish" })
                    }
                    className="somi-control rounded-lg bg-[rgba(251,191,36,0.12)] px-3 py-2 text-[10px] font-semibold text-[var(--color-status-warning)]"
                  >
                    Unpublish
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AdminActionDialog
        open={Boolean(dialog)}
        title={
          dialog?.action === "approve"
            ? "Approve content"
            : dialog?.action === "reject"
              ? "Reject content"
              : dialog?.action === "changes"
                ? "Request revisions"
                : "Unpublish content"
        }
        description="This moderation decision will update the content record and log the event in the audit trail."
        confirmLabel={
          dialog?.action === "approve"
            ? "Approve"
            : dialog?.action === "reject"
              ? "Reject"
              : dialog?.action === "changes"
                ? "Request changes"
                : "Unpublish"
        }
        variant={
          dialog?.action === "reject" || dialog?.action === "unpublish"
            ? "danger"
            : "default"
        }
        onConfirm={confirmBookAction}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}
