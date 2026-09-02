import type { ReactNode } from "react";
import { Clock } from "lucide-react";
import type { StatusTone } from "../config/designSystem";

const toneClass: Record<StatusTone, string> = {
  success: "status-success",
  warning: "status-warning",
  danger: "status-danger",
  info: "status-info",
  neutral: "status-neutral",
};

export function StatusBadge({
  label,
  tone,
  compact = false,
}: {
  label: string;
  tone: StatusTone;
  compact?: boolean;
}) {
  return (
    <span
      className={`somi-status-badge ${toneClass[tone]} ${compact ? "somi-status-badge-compact" : ""}`}
    >
      <span aria-hidden="true" className="somi-status-dot" />
      {label}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className="somi-toggle"
      data-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="somi-toggle-thumb" />
    </button>
  );
}

export function LoadingState({ label = "Loading SOMI" }: { label?: string }) {
  return (
    <div className="somi-state">
      <span className="somi-spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="somi-state">
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  action,
}: {
  title?: string;
  action?: ReactNode;
}) {
  return (
    <div className="somi-state somi-state-error">
      <h2>{title}</h2>
      {action}
    </div>
  );
}

export function TransactionRow({
  icon,
  label,
  date,
  amount,
  tone = "neutral",
  pending = false,
}: {
  icon: ReactNode;
  label: string;
  date: string;
  amount: number;
  tone?: "credit" | "debit" | "neutral";
  pending?: boolean;
}) {
  const color =
    tone === "credit"
      ? "var(--color-status-success)"
      : tone === "debit"
        ? "var(--color-status-danger)"
        : "var(--color-text-muted)";

  return (
    <div className="somi-transaction-row">
      <div className="somi-transaction-icon">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="somi-transaction-label">{label}</p>
        <div className="somi-transaction-meta">
          <Clock size={9} color="var(--color-text-muted)" />
          <span>{date}</span>
          {pending && <span className="somi-transaction-status">Pending</span>}
        </div>
      </div>
      <span className="somi-transaction-amount" style={{ color }}>
        {amount > 0 ? "+" : ""}
        {amount.toLocaleString()}
      </span>
    </div>
  );
}
