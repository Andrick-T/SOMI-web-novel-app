import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileText,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { mockAdminRepository } from "../../features/admin";
import AdminActionDialog from "../../components/AdminActionDialog";
import { StatusBadge } from "../../components/DesignPrimitives";
import { statusToneFor } from "../../config/designSystem";
import type { CommonProps } from "../../types";

export default function AdminContentDetail({ navigate }: CommonProps) {
  const { bookId } = useParams();

  const [dialog, setDialog] = useState<{
    action: "approve" | "reject" | "changes" | "unpublish";
  } | null>(null);

  const book = useMemo(
    () => (bookId ? mockAdminRepository.getBook(bookId) : undefined),
    [bookId],
  );

  if (!book) {
    return (
      <main className="somi-admin-page">
        <div className="somi-admin-inner">
          <div className="somi-admin-empty-state">
            <p>Book not found.</p>

            <button
              type="button"
              onClick={() => navigate("admin-content")}
              className="somi-admin-row-action"
            >
              <ArrowLeft size={13} />
              Back to content
            </button>
          </div>
        </div>
      </main>
    );
  }

  const runBookAction = () => {
    if (!dialog || !bookId) return;

    const current = mockAdminRepository.getBook(bookId);

    if (!current) {
      setDialog(null);
      return;
    }

    if (dialog.action === "approve") {
      mockAdminRepository.updateBook(bookId, {
        status: "PUBLISHED",
        moderationStatus: "APPROVED",
        metadata: {
          ...(current.metadata ?? {}),
          approvedAt: new Date().toISOString(),
        },
      });
    }

    if (dialog.action === "reject") {
      mockAdminRepository.updateBook(bookId, {
        status: "REJECTED",
        moderationStatus: "REJECTED",
        metadata: {
          ...(current.metadata ?? {}),
          rejectionReason: "Policy review",
        },
      });
    }

    if (dialog.action === "changes") {
      mockAdminRepository.updateBook(bookId, {
        status: "EDITING",
        moderationStatus: "CHANGES_REQUESTED",
        metadata: {
          ...(current.metadata ?? {}),
          feedback: "Requires revision before publication.",
        },
      });
    }

    if (dialog.action === "unpublish") {
      mockAdminRepository.updateBook(bookId, {
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
      targetId: bookId,
      metadata: {
        action: dialog.action,
      },
      timestamp: new Date().toISOString(),
    });

    setDialog(null);

    navigate("admin-content", bookId);
  };

  const actionLabel =
    dialog?.action === "approve"
      ? "Approve"
      : dialog?.action === "reject"
        ? "Reject"
        : dialog?.action === "changes"
          ? "Request changes"
          : "Unpublish";

  return (
    <main className="somi-admin-page">
      <div className="somi-admin-inner">
        <header className="somi-admin-detail-header">
          <button
            type="button"
            onClick={() => navigate("admin-content")}
            className="somi-admin-row-action-secondary"
          >
            <ArrowLeft size={13} />
            Content
          </button>

          <div>
            <p className="somi-admin-eyebrow">Content review</p>

            <h1 className="somi-admin-title">{book.title}</h1>

            <p className="somi-admin-description">by {book.writer}</p>
          </div>
        </header>

        <section className="somi-admin-detail-grid">
          <div className="somi-admin-detail-main">
            <div className="somi-admin-detail-heading">
              <div className="somi-admin-content-icon is-large">
                <BookOpen size={20} />
              </div>

              <div>
                <p className="somi-admin-section-eyebrow">Publication record</p>

                <h2 className="somi-admin-section-title">{book.title}</h2>

                <p className="somi-admin-detail-author">
                  Written by {book.writer}
                </p>
              </div>

              <StatusBadge
                label={book.moderationStatus}
                tone={statusToneFor(book.moderationStatus)}
                compact
              />
            </div>

            <div className="somi-admin-detail-meta">
              <div>
                <span>Genre</span>
                <strong>{book.genre}</strong>
              </div>

              <div>
                <span>Chapters</span>
                <strong>{book.chapters}</strong>
              </div>

              <div>
                <span>Publication status</span>
                <strong>{book.status}</strong>
              </div>

              <div>
                <span>Created</span>
                <strong>{new Date(book.createdAt).toLocaleDateString()}</strong>
              </div>

              <div>
                <span>Last updated</span>
                <strong>{new Date(book.updatedAt).toLocaleDateString()}</strong>
              </div>

              <div>
                <span>Submitted</span>
                <strong>
                  {book.submittedAt
                    ? new Date(book.submittedAt).toLocaleDateString()
                    : "—"}
                </strong>
              </div>
            </div>

            {book.metadata && Object.keys(book.metadata).length > 0 && (
              <div className="somi-admin-detail-note">
                <p className="somi-admin-section-eyebrow">Moderation notes</p>

                {Object.entries(book.metadata).map(([key, value]) => (
                  <div key={key} className="somi-admin-detail-note-row">
                    <span>{key}</span>
                    <strong>{String(value)}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="somi-admin-detail-side">
            <p className="somi-admin-section-eyebrow">Moderation</p>

            <h2 className="somi-admin-section-title">Review actions</h2>

            <p className="somi-admin-detail-side-description">
              Apply a moderation decision to this publication.
            </p>

            <div className="somi-admin-detail-actions">
              {book.status !== "PUBLISHED" && (
                <button
                  type="button"
                  onClick={() =>
                    setDialog({
                      action: "approve",
                    })
                  }
                  className="somi-admin-detail-action"
                >
                  <CheckCircle2 size={15} />
                  Approve
                </button>
              )}

              {book.status !== "REJECTED" && (
                <button
                  type="button"
                  onClick={() =>
                    setDialog({
                      action: "reject",
                    })
                  }
                  className="somi-admin-detail-action is-danger"
                >
                  <XCircle size={15} />
                  Reject
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  setDialog({
                    action: "changes",
                  })
                }
                className="somi-admin-detail-action"
              >
                <FileText size={15} />
                Request changes
              </button>

              {book.status === "PUBLISHED" && (
                <button
                  type="button"
                  onClick={() =>
                    setDialog({
                      action: "unpublish",
                    })
                  }
                  className="somi-admin-detail-action is-danger"
                >
                  <ShieldAlert size={15} />
                  Unpublish
                </button>
              )}
            </div>
          </aside>
        </section>
      </div>

      <AdminActionDialog
        open={Boolean(dialog)}
        title={`${actionLabel} content`}
        description="This moderation decision will update the content record and create an entry in the audit trail."
        confirmLabel={actionLabel}
        variant={
          dialog?.action === "reject" || dialog?.action === "unpublish"
            ? "danger"
            : "default"
        }
        onConfirm={runBookAction}
        onCancel={() => setDialog(null)}
      />
    </main>
  );
}
