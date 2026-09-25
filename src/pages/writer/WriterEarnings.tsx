import { useEffect, useMemo, useState } from "react";
import {
  CircleDollarSign,
  Clock3,
  Coins,
  RefreshCw,
  Wallet,
  ArrowDownToLine,
  CheckCircle2,
  AlertCircle,
  Settings2,
  LifeBuoy,
} from "lucide-react";
import type { CommonProps } from "../../types";
import { writerRepository } from "../../features/writer";
import {
  apiWriterRepository,
  useApiWriterContent,
} from "../../services/repositories/writerRepository";

type EarningsSummary = {
  totalCoins: number;
  pendingCoins: number;
  availableCoins: number;
};

type EarningTransaction = {
  id: string;
  bookId: string;
  chapterId: string;
  coins: number;
  status: string;
  createdAt: string;
};



type FinancialRules = {
  currencies: Array<{ code: "XAF" | "USD" | "EUR" | "CAD"; exchangeRateCfa: number }>;
  payoutMethods: Array<"ORANGE_MONEY" | "MTN_MOBILE_MONEY" | "PAYPAL">;
  coinsPerCfa: number;
  cfaPerCoin: number;
  minimumWithdrawalCoins: number;
  minimumWithdrawalCfa: number;
};

type Withdrawal = {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  coins: number;
  amountCfa: number;
  currency: string;
  exchangeRateCfa: number;
  amount: number;
  payoutMethod: string;
  payoutAccount: string;
  payoutAccountName: string | null;
  failureCount: number;
  failureMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

const formatCoins = (value: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const statusLabel = (status: string) =>
  status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function WriterEarnings({}: CommonProps) {
  const mockEarnings = writerRepository.getEarnings();

  const [summary, setSummary] = useState<EarningsSummary>({
    totalCoins: mockEarnings.grossEarnings,
    pendingCoins: mockEarnings.pending,
    availableCoins: mockEarnings.available,
  });

  const [transactions, setTransactions] = useState<EarningTransaction[]>([]);

  const [books, setBooks] = useState<Array<{ id: string; title: string }>>([]);
  const [financialRules, setFinancialRules] = useState<FinancialRules | null>(null);
  const [withdrawalSummary, setWithdrawalSummary] = useState({ availableCoins: 0, minimumCoins: 21000, eligible: false });
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [financialProfile, setFinancialProfile] = useState<{
    preferredCurrency: "XAF" | "USD" | "EUR" | "CAD";
    payoutMethod: "ORANGE_MONEY" | "MTN_MOBILE_MONEY" | "PAYPAL" | null;
    payoutAccount: string | null;
    payoutAccountName: string | null;
  } | null>(null);
  const [kyc, setKyc] = useState<{ status: string; rejectionReason?: string | null; documents: Array<{ id: string; documentType: string; status: string; createdAt: string }> } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [supportTickets, setSupportTickets] = useState<Array<{
    id: string; category: string; subject: string; status: string; priority: string;
    relatedWithdrawalId: string | null; createdAt: string; updatedAt: string;
    messages: Array<{ id: string; senderId: string; body: string; createdAt: string }>;
  }>>([]);
  const [supportSubject, setSupportSubject] = useState("");
  const [supportBody, setSupportBody] = useState("");
  const [supportWithdrawalId, setSupportWithdrawalId] = useState("");
  const [supportLoading, setSupportLoading] = useState(false);
  const [withdrawalCoins, setWithdrawalCoins] = useState(21000);
  const [withdrawalMessage, setWithdrawalMessage] = useState("");
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);


  const [loading, setLoading] = useState(useApiWriterContent);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!useApiWriterContent) {
      const mockBooks = writerRepository.getWriterBooks().map((book) => ({
        id: book.id,
        title: book.title,
      }));

      setBooks(mockBooks);

      return;
    }

    let cancelled = false;

    setLoading(true);
    setLoadError("");

    Promise.all([
      apiWriterRepository.getEarnings(),
      apiWriterRepository.getEarningTransactions(),
      apiWriterRepository.getWriterBooks(),
      apiWriterRepository.getFinancialRules(),
      apiWriterRepository.getWithdrawalSummary(),
      apiWriterRepository.getWithdrawals(),
      apiWriterRepository.getWriterFinancialProfile(),
      apiWriterRepository.getKyc(),
      apiWriterRepository.getSupportTickets(),
    ])
       .then(([earnings, transactionResult, writerBooks, rules, withdrawalResult, withdrawalList, withdrawalProfile, kycResult, supportResult]) => {
        if (cancelled) return;

        setSummary(earnings);
        setTransactions(transactionResult.transactions ?? []);

        setBooks(
          writerBooks.map((book) => ({
            id: book.id,
            title: book.title,
          })),
        );
        setFinancialRules(rules);
        setWithdrawalSummary(withdrawalResult);
        setWithdrawals(withdrawalList.withdrawals);
        setFinancialProfile(withdrawalProfile);
        setKyc(kycResult.kyc);
        setSupportTickets(supportResult.tickets ?? []);
      })
      .catch((caught) => {
        if (cancelled) return;

        setLoadError(
          caught instanceof Error ? caught.message : "Unable to load earnings.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const bookTitles = useMemo(
    () => new Map(books.map((book) => [book.id, book.title])),
    [books],
  );

  const mockTransactions = useMemo(
    () => [
      {
        id: "mock-1",
        bookId: "baobab-kingdom",
        chapterId: "baobab-kingdom-ch-3",
        coins: 620,
        status: "COMPLETED",
        createdAt: "2024-06-20T00:00:00.000Z",
      },
      {
        id: "mock-2",
        bookId: "echoes-of-kongo",
        chapterId: "echoes-of-kongo-ch-2",
        coins: 470,
        status: "PENDING",
        createdAt: "2024-06-18T00:00:00.000Z",
      },
      {
        id: "mock-3",
        bookId: "baobab-kingdom",
        chapterId: "baobab-kingdom-ch-3",
        coins: 310,
        status: "COMPLETED",
        createdAt: "2024-06-15T00:00:00.000Z",
      },
    ],
    [],
  );

  const visibleTransactions = useApiWriterContent
    ? transactions
    : mockTransactions;

  return (
    <div className="somi-writer-page">
      <div className="somi-writer-inner">
        <header className="somi-writer-header">
          <div>
            <p className="somi-writer-eyebrow">Writer Studio</p>

            <h1 className="somi-writer-title">Earnings</h1>

            <p className="somi-writer-description">
              Track the coins generated by your stories and monitor what is
              pending or currently available.
            </p>
          </div>

          <button
            type="button"
            className="somi-writer-secondary-action"
            onClick={() => window.location.reload()}
            disabled={loading}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </header>

        {loadError && (
          <div className="somi-writer-notice">
            <p className="somi-writer-notice-title">
              Earnings could not be loaded
            </p>

            <p className="somi-writer-notice-text">{loadError}</p>
          </div>
        )}

        <section className="somi-writer-section">
          <div className="somi-c5-earnings-grid">
            <article className="somi-c5-earnings-primary">
              <div className="somi-c5-earnings-icon">
                <Coins size={19} />
              </div>

              <p className="somi-c5-earnings-label">Total earnings</p>

              <p className="somi-c5-earnings-value">
                {formatCoins(summary.totalCoins)}
              </p>

              <p className="somi-c5-earnings-unit">coins</p>
            </article>

            <article className="somi-c5-earnings-item">
              <Clock3 size={17} />

              <div>
                <p className="somi-c5-earnings-item-value">
                  {formatCoins(summary.pendingCoins)}
                </p>

                <p className="somi-c5-earnings-item-label">Pending coins</p>
              </div>
            </article>

            <article className="somi-c5-earnings-item">
              <Wallet size={17} />

              <div>
                <p className="somi-c5-earnings-item-value">
                  {formatCoins(summary.availableCoins)}
                </p>

                <p className="somi-c5-earnings-item-label">Available coins</p>
              </div>
            </article>
          </div>
        </section>

        <section className="somi-writer-section">
          <div className="somi-c5-section-heading">
            <div>
              <p className="somi-writer-eyebrow">Earnings activity</p>

              <h2 className="somi-c5-section-title">Recent earnings</h2>
            </div>

            <span className="somi-c5-section-meta">
              {useApiWriterContent ? "Live platform data" : "Demo data"}
            </span>
          </div>

          {loading ? (
            <div className="somi-c5-empty">Loading earnings…</div>
          ) : visibleTransactions.length === 0 ? (
            <div className="somi-c5-empty">
              <CircleDollarSign size={20} />

              <p>No earnings yet.</p>

              <span>
                Earnings from eligible chapter activity will appear here.
              </span>
            </div>
          ) : (
            <div className="somi-c5-transactions">
              {visibleTransactions.map((transaction) => (
                <article key={transaction.id} className="somi-c5-transaction">
                  <div className="somi-c5-transaction-main">
                    <p className="somi-c5-transaction-title">
                      {bookTitles.get(transaction.bookId) ?? transaction.bookId}
                    </p>

                    <p className="somi-c5-transaction-meta">
                      Chapter {transaction.chapterId}
                      {" · "}
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>

                  <div className="somi-c5-transaction-side">
                    <p className="somi-c5-transaction-coins">
                      +{formatCoins(transaction.coins)}
                    </p>

                    <span className="somi-c5-transaction-status">
                      {statusLabel(transaction.status)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {useApiWriterContent && (
          <>
            <section className="somi-writer-section">
              <div className="somi-c5-section-heading">
                <div><p className="somi-writer-eyebrow">Payment setup</p><h2 className="somi-c5-section-title">Payout profile & verification</h2></div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <form
                  className="rounded-xl border border-[var(--color-border-default)] p-4"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (!financialProfile) return;
                    setProfileSaving(true);
                    setWithdrawalMessage("");
                    try {
                      const saved = await apiWriterRepository.saveWriterFinancialProfile(financialProfile);
                      setFinancialProfile(saved as typeof financialProfile);
                      setWithdrawalMessage("Payout profile saved.");
                    } catch (error) {
                      setWithdrawalMessage(error instanceof Error ? error.message : "Unable to save payout profile.");
                    } finally {
                      setProfileSaving(false);
                    }
                  }}
                >
                  <p className="mb-4 text-sm font-semibold">Payment destination</p>
                  <div className="grid gap-3">
                    <label className="text-sm"><span className="mb-1 block text-xs text-[var(--color-text-muted)]">Currency</span>
                      <select value={financialProfile?.preferredCurrency ?? "XAF"} onChange={(e) => setFinancialProfile((p) => p ? { ...p, preferredCurrency: e.target.value as typeof p.preferredCurrency } : p)} className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-active-surface)] px-3 py-2.5">
                        {financialRules?.currencies.map((currency) => <option key={currency.code} value={currency.code}>{currency.code}</option>)}
                      </select>
                    </label>
                    <label className="text-sm"><span className="mb-1 block text-xs text-[var(--color-text-muted)]">Payout method</span>
                      <select value={financialProfile?.payoutMethod ?? ""} onChange={(e) => setFinancialProfile((p) => p ? { ...p, payoutMethod: (e.target.value || null) as typeof p.payoutMethod } : p)} className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-active-surface)] px-3 py-2.5">
                        <option value="">Select method</option>
                        {financialRules?.payoutMethods.map((method) => <option key={method} value={method}>{method.replaceAll("_", " ")}</option>)}
                      </select>
                    </label>
                    <label className="text-sm"><span className="mb-1 block text-xs text-[var(--color-text-muted)]">Account / phone / email</span>
                      <input value={financialProfile?.payoutAccount ?? ""} onChange={(e) => setFinancialProfile((p) => p ? { ...p, payoutAccount: e.target.value || null } : p)} className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-active-surface)] px-3 py-2.5" />
                    </label>
                    <label className="text-sm"><span className="mb-1 block text-xs text-[var(--color-text-muted)]">Account holder name</span>
                      <input value={financialProfile?.payoutAccountName ?? ""} onChange={(e) => setFinancialProfile((p) => p ? { ...p, payoutAccountName: e.target.value || null } : p)} className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-active-surface)] px-3 py-2.5" />
                    </label>
                  </div>
                  <button type="submit" disabled={profileSaving} className="somi-writer-primary-action mt-4 disabled:opacity-50"><Settings2 size={15} />{profileSaving ? "Saving..." : "Save payment setup"}</button>
                </form>
                <div className="rounded-xl border border-[var(--color-border-default)] p-4">
                  <div className="flex items-center gap-2"><LifeBuoy size={17} /><p className="text-sm font-semibold">Identity verification</p></div>
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    {kyc?.status === "APPROVED" ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
                    <span>Status: {statusLabel(kyc?.status ?? "NOT_STARTED")}</span>
                  </div>
                  <p className="mt-3 text-xs text-[var(--color-text-muted)]">KYC approval is required before a payout can be requested.</p>
                  {kyc?.rejectionReason && <p className="mt-3 text-xs">{kyc.rejectionReason}</p>}
                </div>
              </div>
            </section>

            <section className="somi-writer-section">
              <div className="somi-c5-insight">
                <div>
                  <p className="somi-writer-eyebrow">Payout</p>
                  <h2 className="somi-c5-section-title">Turn available coins into a payout.</h2>
                </div>
                <p>
                  Minimum withdrawal: {financialRules?.minimumWithdrawalCoins.toLocaleString() ?? "21,000"} coins
                  {" "}({financialRules?.minimumWithdrawalCfa.toLocaleString() ?? "5,000"} XAF).
                </p>
              </div>

              <div className="somi-writer-stats">
                <div className="somi-writer-stat">
                  <div className="somi-writer-stat-label"><Wallet size={16} />Available</div>
                  <div className="somi-writer-stat-value">{formatCoins(withdrawalSummary.availableCoins)} <span className="text-xs">coins</span></div>
                  <p className="somi-writer-stat-sub">{withdrawalSummary.eligible ? "Eligible for withdrawal" : "Not yet eligible"}</p>
                </div>
                <div className="somi-writer-stat">
                  <div className="somi-writer-stat-label"><ArrowDownToLine size={16} />Minimum</div>
                  <div className="somi-writer-stat-value">{formatCoins(withdrawalSummary.minimumCoins)}</div>
                  <p className="somi-writer-stat-sub">coins required</p>
                </div>
              </div>

              {withdrawalMessage && <div className="somi-writer-notice"><p className="somi-writer-notice-text">{withdrawalMessage}</p></div>}

              <form
                className="somi-writer-section"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setWithdrawalMessage("");
                  setWithdrawalLoading(true);
                  try {
                    const result = await apiWriterRepository.requestWithdrawal(withdrawalCoins);
                    setWithdrawals((current) => [result.withdrawal as Withdrawal, ...current]);
                    const [nextSummary] = await Promise.all([
                      apiWriterRepository.getWithdrawalSummary(),
                      apiWriterRepository.getEarnings(),
                    ]);
                    setWithdrawalSummary(nextSummary);
                    setWithdrawalMessage("Withdrawal request submitted successfully.");
                  } catch (error) {
                    setWithdrawalMessage(error instanceof Error ? error.message : "Unable to submit withdrawal.");
                  } finally {
                    setWithdrawalLoading(false);
                  }
                }}
              >
                <div className="flex flex-wrap items-end gap-3">
                  <label className="min-w-[220px] flex-1 text-sm">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Coins to withdraw</span>
                    <input
                      type="number"
                      min={withdrawalSummary.minimumCoins}
                      max={withdrawalSummary.availableCoins}
                      step={1}
                      value={withdrawalCoins}
                      onChange={(event) => setWithdrawalCoins(Number(event.target.value))}
                      className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-active-surface)] px-3 py-2.5 text-sm"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={withdrawalLoading || !withdrawalSummary.eligible || withdrawalCoins < withdrawalSummary.minimumCoins || withdrawalCoins > withdrawalSummary.availableCoins}
                    className="somi-writer-primary-action disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowDownToLine size={15} />
                    {withdrawalLoading ? "Submitting..." : "Request payout"}
                  </button>
                </div>
              </form>
            </section>

            <section className="somi-writer-section">
              <div className="somi-c5-section-heading">
                <div><p className="somi-writer-eyebrow">Payout history</p><h2 className="somi-c5-section-title">Recent withdrawals</h2></div>
              </div>
              {withdrawals.some((withdrawal) => withdrawal.status === "FAILED") && (
                <div className="mb-4 rounded-xl border border-[var(--color-border-default)] p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={18} />
                    <div>
                      <p className="text-sm font-semibold">A withdrawal needs attention</p>
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        If a withdrawal failed, you can contact support and attach the affected request.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {withdrawals.length === 0 ? (
                <div className="somi-c5-empty">No withdrawal requests yet.</div>
              ) : (
                <div className="somi-c5-transactions">
                  {withdrawals.map((withdrawal) => (
                    <article key={withdrawal.id} className="somi-c5-transaction">
                      <div className="somi-c5-transaction-main">
                        <p className="somi-c5-transaction-title">{withdrawal.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {withdrawal.currency}</p>
                        <p className="somi-c5-transaction-meta">{formatCoins(withdrawal.coins)} coins · {formatDate(withdrawal.createdAt)}</p>
                        {withdrawal.status === "FAILED" && <p className="mt-1 text-xs">{withdrawal.failureMessage}</p>}
                      </div>
                      <span className="somi-c5-transaction-status">{statusLabel(withdrawal.status)}</span>
                    </article>
                  ))}
                </div>
              )}

            <section className="somi-writer-section">
              <div className="somi-c5-section-heading">
                <div>
                  <p className="somi-writer-eyebrow">Support</p>
                  <h2 className="somi-c5-section-title">Payment support</h2>
                </div>
              </div>
              <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
                <form
                  className="rounded-xl border border-[var(--color-border-default)] p-4"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (!supportSubject.trim() || !supportBody.trim()) return;
                    setSupportLoading(true);
                    setWithdrawalMessage("");
                    try {
                      const result = await apiWriterRepository.createSupportTicket({
                        category: "WITHDRAWAL_FAILURE",
                        subject: supportSubject,
                        body: supportBody,
                        withdrawalId: supportWithdrawalId || undefined,
                      }) as { ticket: typeof supportTickets[number] };
                      setSupportTickets((current) => [result.ticket, ...current]);
                      setSupportSubject("");
                      setSupportBody("");
                      setSupportWithdrawalId("");
                      setWithdrawalMessage("Support ticket created.");
                    } catch (error) {
                      setWithdrawalMessage(error instanceof Error ? error.message : "Unable to create support ticket.");
                    } finally {
                      setSupportLoading(false);
                    }
                  }}
                >
                  <p className="mb-4 text-sm font-semibold">Contact support</p>
                  <div className="grid gap-3">
                    <label className="text-sm"><span className="mb-1 block text-xs text-[var(--color-text-muted)]">Related withdrawal</span>
                      <select value={supportWithdrawalId} onChange={(e) => setSupportWithdrawalId(e.target.value)} className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-active-surface)] px-3 py-2.5">
                        <option value="">No specific withdrawal</option>
                        {withdrawals.map((withdrawal) => <option key={withdrawal.id} value={withdrawal.id}>{withdrawal.amount.toFixed(2)} {withdrawal.currency} — {statusLabel(withdrawal.status)}</option>)}
                      </select>
                    </label>
                    <input required value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} placeholder="Subject" className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-active-surface)] px-3 py-2.5 text-sm" />
                    <textarea required value={supportBody} onChange={(e) => setSupportBody(e.target.value)} placeholder="Describe the issue..." rows={5} className="w-full resize-y rounded-lg border border-[var(--color-border-default)] bg-[var(--color-active-surface)] px-3 py-2.5 text-sm" />
                  </div>
                  <button type="submit" disabled={supportLoading} className="somi-writer-primary-action mt-4 disabled:opacity-50">
                    <LifeBuoy size={15} />{supportLoading ? "Sending..." : "Contact support"}
                  </button>
                </form>
                <div className="space-y-3">
                  {supportTickets.length === 0 ? (
                    <div className="somi-c5-empty">No support conversations yet.</div>
                  ) : supportTickets.map((ticket) => (
                    <article key={ticket.id} className="rounded-xl border border-[var(--color-border-default)] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{ticket.subject}</p>
                          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                            {ticket.priority} · {ticket.status}{ticket.relatedWithdrawalId ? " · linked to withdrawal" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        {ticket.messages.map((message) => (
                          <div key={message.id} className="rounded-lg bg-[var(--color-active-surface)] p-3 text-sm">
                            <p>{message.body}</p>
                            <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">{formatDate(message.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        </section>

        <section className="somi-writer-section">
          <div className="somi-c5-insight">
            <div>
              <p className="somi-writer-eyebrow">SOMI economy</p>

              <h2 className="somi-c5-section-title">
                Your earnings are measured in SOMI coins.
              </h2>
            </div>

            <p>
              Pending coins represent earnings that have not yet become
              available. Available coins are the portion currently available to
              the writer according to the platform ledger.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
