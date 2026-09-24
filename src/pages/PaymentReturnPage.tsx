import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, CreditCard, RefreshCw, XCircle } from "lucide-react";
import type { CommonProps } from "../types";
import { apiWalletRepository, useApiEconomy } from "../services/repositories/walletRepository";

type PaymentStatus = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "CANCELLED" | "EXPIRED";

type PaymentState = {
  status: PaymentStatus;
  coins: number;
  amountCfa?: number | null;
  currency: string;
  somiReference: string;
};

const STATUS_COPY: Record<PaymentStatus, { title: string; message: string }> = {
  PENDING: { title: "Payment is being prepared", message: "We are waiting for confirmation from the payment provider." },
  PROCESSING: { title: "Payment is being confirmed", message: "Your payment has been received by the provider. SOMI is confirming it now." },
  SUCCESS: { title: "Payment confirmed", message: "Your coins have been added to your SOMI wallet." },
  FAILED: { title: "Payment failed", message: "The payment was not confirmed. No coins were added to your wallet." },
  CANCELLED: { title: "Payment cancelled", message: "This payment was cancelled. No coins were added to your wallet." },
  EXPIRED: { title: "Payment expired", message: "This payment session expired before it was confirmed." },
};

export default function PaymentReturnPage({ navigate, coins }: CommonProps) {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const reference =
    params.get("reference") ??
    params.get("transaction_id") ??
    params.get("transactionId") ??
    "";
  const [payment, setPayment] = useState<PaymentState | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);\n  const [walletBalance, setWalletBalance] = useState(coins);

  const checkPayment = async () => {
    if (!reference || !useApiEconomy) {
      setChecking(false);
      if (!reference) setError("The payment reference is missing.");
      return;
    }

    setChecking(true);
    setError("");

    try {
      const result = await apiWalletRepository.getPaymentByReference(reference);
      setPayment({
        status: result.status as PaymentStatus,
        coins: result.coins,
        amountCfa: result.amountCfa,
        currency: result.currency,
        somiReference: result.somiReference,
      });
    } catch {
      setError("We could not retrieve this payment yet. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    void checkPayment();
  }, [reference]);

  useEffect(() => {
    if (!payment || !["PENDING", "PROCESSING"].includes(payment.status)) return;
    const timer = window.setInterval(() => void checkPayment(), 5000);
    return () => window.clearInterval(timer);
  }, [payment?.status, reference]);

  const status = payment?.status;
  const copy = status ? STATUS_COPY[status] : null;
  const isSuccess = status === "SUCCESS";
  const isTerminal = Boolean(status && !["PENDING", "PROCESSING"].includes(status));

  const icon = isSuccess ? (
    <CheckCircle2 size={30} strokeWidth={1.7} />
  ) : status === "FAILED" || status === "CANCELLED" || status === "EXPIRED" ? (
    <XCircle size={30} strokeWidth={1.7} />
  ) : (
    <Clock3 size={30} strokeWidth={1.7} />
  );

  return (
    <div className="min-h-screen bg-[#0d0b18] px-5 py-10 text-[#f5efe5] sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center justify-center">
        <section className="w-full border border-white/10 bg-[#151220] shadow-2xl shadow-black/20">
          <div className="border-b border-white/10 px-6 py-7 sm:px-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center border border-[#e8a84c]/25 bg-[#e8a84c]/10 text-[#e8b363]">
              {icon}
            </div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#8b7ea8]">
              SOMI payments
            </p>
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#f7f0e6] sm:text-3xl">
              {checking && !payment ? "Checking your payment" : copy?.title ?? "Payment status"}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-[#aaa0ba]">
              {checking && !payment
                ? "Please wait while we retrieve the payment status from SOMI."
                : error || copy?.message}
            </p>
          </div>

          {payment && (
            <div className="space-y-0 divide-y divide-white/10">
              <div className="grid grid-cols-2 gap-5 px-6 py-5 sm:px-8">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#746a86]">Payment</p>
                  <p className="mt-1 truncate text-sm font-medium text-[#e9e1d7]">{payment.somiReference}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#746a86]">Status</p>
                  <p className="mt-1 text-sm font-semibold text-[#e8b363]">{payment.status}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5 px-6 py-5 sm:px-8">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#746a86]">Amount</p>
                  <p className="mt-1 text-sm text-[#e9e1d7]">
                    {payment.amountCfa != null ? payment.amountCfa.toLocaleString() + " CFA" : payment.currency}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#746a86]">Coins</p>
                  <p className="mt-1 text-sm font-semibold text-[#e8b363]">{payment.coins.toLocaleString()}</p>
                </div>
              </div>

              {isSuccess && (
                <div className="px-6 py-5 sm:px-8">
                  <div className="flex items-center justify-between border border-[#e8a84c]/20 bg-[#e8a84c]/5 px-4 py-3">
                    <span className="text-xs text-[#aaa0ba]">Wallet balance</span>
                    <span className="text-sm font-semibold text-[#f0c477]">{walletBalance.toLocaleString()} coins</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {!payment && !checking && error && (
            <div className="px-6 py-5 text-sm text-[#aaa0ba] sm:px-8">
              <div className="flex items-start gap-3 border border-white/10 bg-[#11101a] px-4 py-3">
                <CreditCard size={18} className="mt-0.5 shrink-0 text-[#8b7ea8]" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-white/10 px-6 py-6 sm:flex-row sm:px-8">
            {(!isTerminal || error) && (
              <button type="button" onClick={() => void checkPayment()} disabled={checking}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 border border-white/10 bg-white/[0.03] px-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#ddd5cb] transition hover:border-[#e8a84c]/40 hover:bg-[#e8a84c]/5 disabled:cursor-not-allowed disabled:opacity-50">
                <RefreshCw size={15} className={checking ? "animate-spin" : ""} />
                Check again
              </button>
            )}
            <button type="button" onClick={() => navigate("wallet")}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 bg-[#e8a84c] px-4 text-xs font-bold uppercase tracking-[0.14em] text-[#17120c] transition hover:bg-[#f0b45b]">
              {isSuccess ? "Go to wallet" : "Back to wallet"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
