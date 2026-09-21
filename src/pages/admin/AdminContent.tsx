import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, BookOpen, Search, ShieldAlert } from "lucide-react";
import { mockAdminRepository } from "../../features/admin";
import AdminActionDialog from "../../components/AdminActionDialog";
import { StatusBadge } from "../../components/DesignPrimitives";
import type { CommonProps } from "../../types";

const statusConfig: Record<
  string,
  {
    label: string;
    tone: "success" | "warning" | "danger" | "info" | "neutral";
  }
> = {
  DRAFT: {
    label: "Draft",
    tone: "neutral",
  },
  EDITING: {
    label: "Editing",
    tone: "warning",
  },
  PROOFREADING: {
    label: "Proofreading",
    tone: "warning",
  },
  READY_FOR_REVIEW: {
    label: "Ready for review",
    tone: "info",
  },
  SCHEDULED: {
    label: "Scheduled",
    tone: "info",
  },
  PUBLISHED: {
    label: "Published",
    tone: "success",
  },
  REJECTED: {
    label: "Rejected",
    tone: "danger",
  },
  UNPUBLISHED: {
    label: "Unpublished",
    tone: "neutral",
  },
  ARCHIVED: {
    label: "Archived",
    tone: "neutral",
  },
};

const statusFilters = [
  "ALL",
  "DRAFT",
  "EDITING",
  "PROOFREADING",
  "READY_FOR_REVIEW",
  "SCHEDULED",
  "PUBLISHED",
  "REJECTED",
  "UNPUBLISHED",
  "ARCHIVED",
] as const;

export default function AdminContent({ navigate }: CommonProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const [status, setStatus] = useState(
    statusFilters.includes(
      searchParams.get("status") as (typeof statusFilters)[number],
    )
      ? (searchParams.get("status") as (typeof statusFilters)[number])
      : "ALL",
  );

  const [dialog, setDialog] = useState<{
    bookId: string;
    action: "approve" | "reject" | "changes" | "unpublish";
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

  const allBooks = useMemo(() => mockAdminRepository.getBooks(), []);

  const books = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return allBooks.filter((book) => {
      const matchesQuery =
        !normalizedQuery ||
        `${book.title} ${book.writer}`.toLowerCase().includes(normalizedQuery);

      const matchesStatus = status === "ALL" || book.status === status;

      return matchesQuery && matchesStatus;
    });
  }, [allBooks, query, status]);

  const contentStats = useMemo(
    () => ({
      total: allBooks.length,
      published: allBooks.filter((book) => book.status === "PUBLISHED").length,
      review: allBooks.filter(
        (book) =>
          book.status === "READY_FOR_REVIEW" ||
          book.moderationStatus === "PENDING",
      ).length,
      rejected: allBooks.filter((book) => book.status === "REJECTED").length,
    }),
    [allBooks],
  );

  const confirmBookAction = () => {
    if (!dialog) return;

    const current = mockAdminRepository.getBook(dialog.bookId);

    if (!current) {
      setDialog(null);
      return;
    }

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
      metadata: {
        action: dialog.action,
      },
      timestamp: new Date().toISOString(),
    });

    setDialog(null);
  };

  return (
    <main className="somi-admin-page">
      <div className="somi-admin-inner">
        <header className="somi-admin-header">
          <div>
            <p className="somi-admin-eyebrow">Administration</p>

            <h1 className="somi-admin-title">Content</h1>

            <p className="somi-admin-description">
              Review books, moderation status, and publishing activity across
              the platform.
            </p>
          </div>
        </header>

        <section className="somi-admin-user-summary">
          <div>
            <strong>{contentStats.total}</strong>
            <span>Total books</span>
          </div>

          <div>
            <strong>{contentStats.published}</strong>
            <span>Published</span>
          </div>

          <div>
            <strong className="somi-admin-summary-warning">
              {contentStats.review}
            </strong>
            <span>Awaiting review</span>
          </div>

          <div>
            <strong className="somi-admin-summary-danger">
              {contentStats.rejected}
            </strong>
            <span>Rejected</span>
          </div>
        </section>

        <section className="somi-admin-toolbar">
          <div className="somi-admin-search">
            <Search size={15} />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search titles or writers"
              aria-label="Search content"
            />
          </div>

          <div className="somi-admin-filter-group">
            {statusFilters.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                className={`somi-admin-filter ${
                  status === value ? "is-active" : ""
                }`}
              >
                {value === "ALL"
                  ? "All content"
                  : (statusConfig[value]?.label ?? value)}
              </button>
            ))}
          </div>
        </section>

        <section className="somi-admin-data-section">
          <div className="somi-admin-data-header">
            <div>
              <p className="somi-admin-section-eyebrow">Content directory</p>

              <h2 className="somi-admin-section-title">
                {books.length} matching {books.length === 1 ? "book" : "books"}
              </h2>
            </div>
          </div>

          {books.length === 0 ? (
            <div className="somi-admin-empty-state">
              <BookOpen size={20} />

              <p>No content matches the current filters.</p>
            </div>
          ) : (
            <div className="somi-admin-content-table">
              <div className="somi-admin-content-table-head">
                <span>Book</span>
                <span>Genre</span>
                <span>Chapters</span>
                <span>Status</span>
                <span>Updated</span>
                <span />
              </div>

              {books.map((book) => {
                const statusInfo =
                  statusConfig[book.status] ?? statusConfig.DRAFT;

                return (
                  <div key={book.id} className="somi-admin-content-row">
                    <div className="somi-admin-content-identity">
                      <div className="somi-admin-content-icon">
                        <BookOpen size={16} />
                      </div>

                      <div className="somi-admin-user-name">
                        <strong>{book.title}</strong>

                        <span>by {book.writer}</span>
                      </div>
                    </div>

                    <span className="somi-admin-content-meta">
                      {book.genre}
                    </span>

                    <span className="somi-admin-content-meta">
                      {book.chapters}
                    </span>

                    <StatusBadge
                      label={statusInfo.label}
                      tone={statusInfo.tone}
                      compact
                    />

                    <span className="somi-admin-content-date">
                      {new Date(book.updatedAt).toLocaleDateString()}
                    </span>

                    <div className="somi-admin-content-actions">
                      <button
                        type="button"
                        onClick={() => navigate("admin-content", book.id)}
                        className="somi-admin-row-action"
                      >
                        Review
                        <ArrowRight size={13} />
                      </button>

                      {book.status !== "PUBLISHED" && (
                        <button
                          type="button"
                          onClick={() =>
                            setDialog({
                              bookId: book.id,
                              action: "approve",
                            })
                          }
                          className="somi-admin-row-action-secondary"
                        >
                          Approve
                        </button>
                      )}

                      {book.status !== "REJECTED" && (
                        <button
                          type="button"
                          onClick={() =>
                            setDialog({
                              bookId: book.id,
                              action: "reject",
                            })
                          }
                          className="somi-admin-row-action-danger"
                        >
                          Reject
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setDialog({
                            bookId: book.id,
                            action: "changes",
                          })
                        }
                        className="somi-admin-row-action-secondary"
                      >
                        <ShieldAlert size={12} />
                        Changes
                      </button>

                      {book.status === "PUBLISHED" && (
                        <button
                          type="button"
                          onClick={() =>
                            setDialog({
                              bookId: book.id,
                              action: "unpublish",
                            })
                          }
                          className="somi-admin-row-action-danger"
                        >
                          Unpublish
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
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
    </main>
  );
}
