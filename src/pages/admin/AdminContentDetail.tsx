import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, CheckCircle2, FileText, ShieldAlert, XCircle } from "lucide-react";
import { mockAdminRepository } from "../../features/admin";
import { StatusBadge } from "../../components/DesignPrimitives";
import { statusToneFor } from "../../config/designSystem";
import type { CommonProps } from "../../types";

export default function AdminContentDetail({ navigate }: CommonProps) {
  const { bookId } = useParams();
  const book = useMemo(() => (bookId ? mockAdminRepository.getBook(bookId) : undefined), [bookId]);

  if (!book) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[var(--color-background)] px-5">
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-6 text-center">
          <p className="text-sm font-semibold text-[var(--color-status-danger)]">Book not found</p>
          <button type="button" onClick={() => navigate("admin-content")} className="somi-control mt-4 rounded-lg bg-[rgba(96,165,250,0.12)] px-3 py-2 text-xs font-semibold text-[var(--color-accent-primary)]">
            Back to content
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[var(--color-background)] px-5 py-8 text-[var(--color-text-primary)]">
      <div className="mb-6 flex items-center justify-between gap-3">
        <button type="button" onClick={() => navigate("admin-content")} className="somi-control flex items-center gap-2 rounded-lg bg-[rgba(96,165,250,0.1)] px-3 py-2 text-xs font-semibold text-[var(--color-accent-primary)]">
          <ArrowLeft size={14} />
          Content
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(96,165,250,0.12)] text-[var(--color-accent-primary)]">
              <BookOpen size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{book.title}</h1>
              <p className="text-sm text-[var(--color-text-secondary)]">by {book.writer}</p>
            </div>
          </div>
          <StatusBadge label={book.moderationStatus} tone={statusToneFor(book.moderationStatus)} compact />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-[var(--color-background)] p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Metadata</p>
            <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              <li>Genre: {book.genre}</li>
              <li>Chapters: {book.chapters}</li>
              <li>Status: {book.status}</li>
              <li>Created: {new Date(book.createdAt).toLocaleDateString()}</li>
              <li>Updated: {new Date(book.updatedAt).toLocaleDateString()}</li>
            </ul>
          </div>

          <div className="rounded-xl bg-[var(--color-background)] p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Moderation actions</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Approve", icon: CheckCircle2 },
                { label: "Reject", icon: XCircle },
                { label: "Request changes", icon: FileText },
                { label: "Unpublish", icon: ShieldAlert },
              ].map(({ label, icon: Icon }) => (
                <button key={label} type="button" className="somi-control flex items-center gap-2 rounded-lg bg-[rgba(96,165,250,0.12)] px-3 py-2 text-xs font-semibold text-[var(--color-accent-primary)]">
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
