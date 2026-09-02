import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, Coins, Search } from "lucide-react";
import { mockAdminRepository } from "../../features/admin";
import { StatusBadge, TransactionRow } from "../../components/DesignPrimitives";
import { statusToneFor } from "../../config/designSystem";
import type { CommonProps } from "../../types";

export default function AdminTransactions({ navigate }: CommonProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [type, setType] = useState(
    ["ALL", "COIN_PURCHASE", "CHAPTER_UNLOCK", "REFUND", "ADJUSTMENT"].includes(searchParams.get("type") ?? "")
      ? (searchParams.get("type") ?? "ALL")
      : "ALL",
  );
  const [status, setStatus] = useState(
    ["ALL", "PENDING", "COMPLETED", "FAILED", "REFUNDED", "CANCELLED"].includes(searchParams.get("status") ?? "")
      ? (searchParams.get("status") ?? "ALL")
      : "ALL",
  );

  const transactions = useMemo(() => {
    const all = mockAdminRepository.getTransactions();
    return all.filter((txn) => {
      const text = `${txn.user} ${txn.id} ${txn.type}`.toLowerCase();
      const matchesSearch = !search || text.includes(search.toLowerCase());
      const matchesType = type === "ALL" || txn.type === type;
      const matchesStatus = status === "ALL" || txn.status === status;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [search, type, status]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (search) next.set("q", search);
    if (type !== "ALL") next.set("type", type);
    if (status !== "ALL") next.set("status", status);
    setSearchParams(next, { replace: true });
  }, [search, type, status, setSearchParams]);

  return (
    <div className="min-h-full bg-[var(--color-background)] px-5 py-8 text-[var(--color-text-primary)]">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Admin Console</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">Transactions</h1>
        </div>
        <button type="button" onClick={() => navigate("admin-economy")} className="somi-control flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[var(--color-accent-primary)] bg-[rgba(96,165,250,0.1)]">
          <ArrowLeft size={14} />
          Economy
        </button>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface)] px-4 py-3">
        <Search size={15} color="var(--color-text-muted)" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search user or transaction id" aria-label="Search transactions" className="w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]" />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(["ALL", "COIN_PURCHASE", "CHAPTER_UNLOCK", "REFUND", "ADJUSTMENT"] as const).map((value) => (
          <button key={value} type="button" onClick={() => setType(value)} className="somi-control rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: type === value ? "var(--color-accent-primary)" : "var(--color-surface)", color: type === value ? "var(--color-background)" : "var(--color-text-secondary)" }}>
            {value}
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(["ALL", "PENDING", "COMPLETED", "FAILED", "REFUNDED", "CANCELLED"] as const).map((value) => (
          <button key={value} type="button" onClick={() => setStatus(value)} className="somi-control rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: status === value ? "var(--color-accent-primary)" : "var(--color-surface)", color: status === value ? "var(--color-background)" : "var(--color-text-secondary)" }}>
            {value}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {transactions.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-6 text-center text-[var(--color-text-secondary)]">No transactions match these filters.</div>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <StatusBadge label={transaction.type} tone={statusToneFor(transaction.type)} compact />
                  <StatusBadge label={transaction.status} tone={statusToneFor(transaction.status)} compact />
                </div>
                <span className="text-right text-sm font-semibold text-[var(--color-text-primary)]">{transaction.amount} {transaction.currency}</span>
              </div>
              <TransactionRow
                icon={<Coins size={12} color="var(--color-status-warning)" />}
                label={transaction.user}
                date={new Date(transaction.timestamp).toLocaleString()}
                amount={transaction.amount}
                tone={transaction.amount >= 0 ? "credit" : "debit"}
                pending={transaction.status === "PENDING"}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
