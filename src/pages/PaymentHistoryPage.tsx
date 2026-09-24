import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, CreditCard, XCircle } from "lucide-react";
import type { CommonProps } from "../types";
import { apiWalletRepository, useApiEconomy } from "../services/repositories/walletRepository";

type Payment = {
  id: string;
  packageId?: string | null;
  amount: number;
  currency: string;
  amountCfa?: number | null;
  coins: number;
  somiReference: string;
  providerReference?: string | null;
  provider: string;
  paymentMethod?: string | null;
  status: string;
  verifiedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
};

const statusIcon = (status: string) => {
  if (status === "SUCCESS") return <CheckCircle2 size={16} />;
  if (["FAILED", "CANCELLED", "EXPIRED"].includes(status)) return <XCircle size={16} />;
  return <Clock3 size={16} />;
};

const statusClass = (status: string) => {
  if (status === "SUCCESS") return "text-[var(--color-status-success)]";
  if (["FAILED", "CANCELLED", "EXPIRED"].includes(status)) return "text-[var(--color-status-danger)]";
  return "text-[var(--color-accent-primary)]";
};

export default function PaymentHistoryPage({ navigate, isLoggedIn }: CommonProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 25;

  const load = async (nextOffset = offset) => {
    if (!useApiEconomy || !isLoggedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await apiWalletRepository.getPaymentHistory(limit, nextOffset);
      setPayments(result.payments);
      setTotal(result.total);
      setOffset(result.offset);
    } catch {
      setError("We could not load your payment history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(0);
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[var(--color-background)] px-6 text-center">
        <div>
          <CreditCard className="mx-auto mb-4 text-[var(--color-accent-primary)]" size={34} />
          <h1 className="font-display text-xl font-bold text-[var(--color-text-primary)]">Payment history</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Sign in to view your payments.</p>
          <button onClick={() => navigate("auth")} className="somi-primary-button mt-5">Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[var(--color-background)] px-5 pb-10 pt-8">
      <div className="mx-auto max-w-2xl">
        <button onClick={() => navigate("wallet")} className="mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
          <ArrowLeft size={15} /> Wallet
        </button>

        <p className="somi-eyebrow">Account</p>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">Payment history</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">A record of your coin purchases and their payment status.</p>

        {error && <div className="mt-5 border border-[rgba(201,96,58,0.35)] bg-[rgba(201,96,58,0.08)] p-4 text-sm text-[var(--color-status-danger)]">{error}</div>}

        <div className="mt-6 overflow-hidden rounded-[1rem] border border-[var(--color-border-default)] bg-[var(--color-surface)]">
          {loading ? (
            <div className="px-5 py-12 text-center text-sm text-[var(--color-text-muted)]">Loading payment history...</div>
          ) : payments.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <CreditCard className="mx-auto mb-3 text-[var(--color-text-muted)]" size={28} />
              <p className="font-display font-semibold text-[var(--color-text-primary)]">No payments yet</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">Your coin purchases will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border-default)]">
              {payments.map((payment) => (
                <button key={payment.id} onClick={() => navigate("payment-return", { reference: payment.somiReference } as never)} className="w-full px-5 py-4 text-left transition hover:bg-[var(--color-surface-muted)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--color-text-primary)]">{payment.packageId ?? "Coin purchase"}</p>
                      <p className="mt-1 truncate text-[11px] text-[var(--color-text-muted)]">{payment.somiReference}</p>
                      <p className="mt-2 text-xs text-[var(--color-text-muted)]">{new Date(payment.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className={`inline-flex items-center gap-1.5 text-xs font-semibold ${statusClass(payment.status)}`}>
                        {statusIcon(payment.status)} {payment.status}
                      </div>
                      <p className="mt-2 text-sm font-bold text-[var(--color-accent-primary)]">+{payment.coins.toLocaleString()} coins</p>
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{payment.amountCfa ?? payment.amount} {payment.amountCfa != null ? "CFA" : payment.currency}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {total > limit && (
          <div className="mt-5 flex items-center justify-between">
            <button disabled={offset === 0 || loading} onClick={() => void load(Math.max(0, offset - limit))} className="somi-quiet-button disabled:opacity-40">Previous</button>
            <span className="text-xs text-[var(--color-text-muted)]">{offset + 1}-{Math.min(offset + limit, total)} of {total}</span>
            <button disabled={offset + limit >= total || loading} onClick={() => void load(offset + limit)} className="somi-quiet-button disabled:opacity-40">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
