import { useMemo } from "react";
import { ArrowRightLeft, Coins, TrendingUp } from "lucide-react";
import { mockAdminRepository } from "../../features/admin";
import type { CommonProps } from "../../types";

export default function AdminEconomy({ navigate }: CommonProps) {
  const summary = useMemo(() => mockAdminRepository.getEconomySummary(), []);

  const cards = [
    {
      label: "Total coin purchases",
      value: summary.totalCoinPurchases.toLocaleString(),
    },
    {
      label: "Total coins spent",
      value: summary.totalCoinsSpent.toLocaleString(),
    },
    { label: "Revenue", value: `$${summary.revenue.toLocaleString()}` },
    { label: "Refunds", value: summary.refunds.toString() },
    { label: "Failed payments", value: summary.failedPayments.toString() },
    {
      label: "Pending transactions",
      value: summary.pendingTransactions.toString(),
    },
  ];

  return (
    <div className="min-h-full bg-[var(--color-background)] px-5 py-8 text-[var(--color-text-primary)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Admin Console
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
            Economy
          </h1>
        </div>
        <button
          type="button"
          onClick={() => navigate("admin-transactions")}
          className="somi-control rounded-lg bg-[rgba(96,165,250,0.12)] px-3 py-2 text-xs font-semibold text-[var(--color-accent-primary)]"
        >
          View transactions
        </button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4"
          >
            <div className="flex items-center justify-between">
              <Coins size={16} color="var(--color-status-warning)" />
              <TrendingUp size={14} color="var(--color-status-success)" />
            </div>
            <p className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">
              {card.value}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              {card.label}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4">
        <div className="mb-3 flex items-center gap-2">
          <ArrowRightLeft size={15} color="var(--color-accent-primary)" />
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Manual adjustment
          </h2>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Adjustments are explicit and logged as audit events. They are not
          silent balance mutations.
        </p>
      </div>
    </div>
  );
}
