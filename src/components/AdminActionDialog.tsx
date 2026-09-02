type AdminActionDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  variant?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
  error?: string;
  success?: string;
};

export default function AdminActionDialog({
  open,
  title,
  description,
  confirmLabel,
  variant = "default",
  onConfirm,
  onCancel,
  pending = false,
  error,
  success,
}: AdminActionDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-surface-overlay)] px-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) =>
        event.target === event.currentTarget && !pending && onCancel()
      }
    >
      <div
        className="w-full max-w-md rounded-[1.25rem] border border-[var(--color-border-default)] bg-[var(--color-surface)] p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-accent-primary)]">
          Confirmation required
        </p>
        <h3 id="admin-dialog-title" className="mt-3 text-xl font-bold text-[var(--color-text-primary)]">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>

        {(error || success) && (
          <div
            className="mt-4 rounded-xl border px-3 py-2 text-xs font-medium"
            style={{
              borderColor: error ? "rgba(251,113,133,0.24)" : "rgba(62,207,142,0.25)",
              background: error ? "rgba(251,113,133,0.08)" : "rgba(62,207,142,0.08)",
              color: error ? "var(--color-status-danger)" : "var(--color-status-success)",
            }}
            aria-live="polite"
          >
            {error ?? success}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="somi-control border border-[var(--color-border-default)] bg-[var(--color-background)] px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="somi-control px-3 py-2 text-xs font-semibold text-[var(--color-background)] disabled:cursor-not-allowed"
            style={{
              background: variant === "danger" ? "var(--color-status-danger)" : "var(--color-accent-primary)",
            }}
          >
            {pending ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
