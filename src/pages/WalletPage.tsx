import { useEffect, useMemo, useState } from "react";
import { Coins, CheckCircle, TrendingUp, Zap, ShieldCheck } from "lucide-react";
import {
  coinPackageCatalog,
  purchaseCoins,
  createWallet,
} from "../features/economy/service";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  TransactionRow,
} from "../components/DesignPrimitives";
import type { CommonProps } from "../types";
import {
  useApiEconomy,
  walletRepository,
} from "../services/repositories/walletRepository";

const bundles = coinPackageCatalog.map((bundle) => ({
  ...bundle,
  priceCFA: bundle.amountCfa,
  bonus: bundle.bonusCoins ?? 0,
  best: bundle.bestValue,
}));

const mockTransactions = [
  {
    id: 1,
    type: "purchase",
    label: "Standard Bundle",
    coins: +1190,
    date: "Aug 24, 2026",
    icon: "💰",
  },
  {
    id: 2,
    type: "spend",
    label: "The Midnight Throne · Ch. 4",
    coins: -80,
    date: "Aug 24, 2026",
    icon: "📖",
  },
  {
    id: 3,
    type: "spend",
    label: "The Midnight Throne · Ch. 5",
    coins: -80,
    date: "Aug 23, 2026",
    icon: "📖",
  },
  {
    id: 4,
    type: "purchase",
    label: "Starter Bundle",
    coins: +680,
    date: "Aug 20, 2026",
    icon: "💰",
  },
  {
    id: 5,
    type: "spend",
    label: "Sins of the Father · Ch. 3",
    coins: -80,
    date: "Aug 19, 2026",
    icon: "📖",
  },
];

export default function WalletPage({
  navigate,
  coins,
  addCoins,
  isLoggedIn,
}: CommonProps) {
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<
    Array<{ id: string; type: string; coins: number; createdAt: string }>
  >([]);

  const bundleData = useMemo(
    () => bundles.find((bundle) => bundle.id === selectedBundle) ?? null,
    [selectedBundle],
  );

  useEffect(() => {
    if (!useApiEconomy) {
      setTransactionHistory(mockTransactions);
      return;
    }
    void walletRepository
      .getTransactions()
      .then((items) => setTransactionHistory(items))
      .catch((requestError: Error) => setError(requestError.message));
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-5 bg-[var(--color-background)] px-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-surface)]">
          <Coins size={36} color="var(--color-accent-primary)" />
        </div>
        <div>
          <h2 className="mb-2 font-display text-xl font-bold text-[var(--color-text-primary)]">
            SOMI Wallet
          </h2>
          <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
            Sign in to buy Somi Coins and unlock premium chapters.
          </p>
        </div>
        <button
          onClick={() => navigate("auth")}
          className="somi-primary-button w-full justify-center"
        >
          Sign In to Continue
        </button>
      </div>
    );
  }

  const handleBuy = (bundleId: string) => {
    setSelectedBundle(bundleId);
    setShowPayModal(true);
    setSuccess(false);
    setError(null);
  };

  const handleConfirmPayment = () => {
    const bundle = bundles.find((item) => item.id === selectedBundle);
    if (!bundle) return;

    setProcessing(true);
    setError(null);

    if (useApiEconomy) {
      setProcessing(false);
      setError("Coin purchases are unavailable until payment is confirmed.");
      return;
    }

    window.setTimeout(() => {
      const result = purchaseCoins({
        userId: "guest-user",
        packageId: bundle.id,
        wallet: createWallet({ userId: "guest-user", balance: coins }),
        transactionHistory: [],
      });

      if (result.success) {
        addCoins(result.wallet.balance - coins);
      }

      setProcessing(false);
      setSuccess(result.success);
      if (!result.success) {
        setError("Your purchase did not complete. Please try again.");
        return;
      }

      window.setTimeout(() => {
        setShowPayModal(false);
        setSelectedBundle(null);
        setSuccess(false);
      }, 1800);
    }, 1000);
  };

  return (
    <div className="relative flex min-h-full flex-col bg-[var(--color-background)]">
      <div className="px-5 pb-6 pt-12">
        <p className="somi-eyebrow">Story economy</p>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
          Wallet
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Somi Coins for unlocking chapters
        </p>
      </div>

      <div className="mx-5 mb-6">
        <div className="relative overflow-hidden rounded-[1.25rem] border border-[rgba(232,168,76,0.25)] bg-[linear-gradient(135deg,#2a1f0a_0%,#1a1400_50%,#231a06_100%)] p-6">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(232,168,76,0.18),transparent_70%)]" />
          <div className="relative">
            <div className="mb-1 flex items-center gap-2">
              <Coins size={16} color="var(--color-accent-primary)" />
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-accent-primary)]">
                Somi Coins
              </span>
            </div>
            <p className="font-display text-4xl font-bold text-[var(--color-accent-primary)]">
              {coins.toLocaleString()}
            </p>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              {Math.floor(coins / 80)} chapters unlockable at 80 coins
            </p>

            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={12} color="var(--color-status-success)" />
                <span className="text-[11px] text-[var(--color-status-success)]">
                  3,150 earned this month
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap size={12} color="var(--color-status-danger)" />
                <span className="text-[11px] text-[var(--color-status-danger)]">
                  240 spent
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 px-5">
        <h3 className="mb-3 font-display text-base font-semibold text-[var(--color-text-primary)]">
          Buy Somi Coins
        </h3>
        <div className="flex flex-col gap-3">
          {bundles.map((bundle) => (
            <button
              key={bundle.id}
              onClick={() => handleBuy(bundle.id)}
              className="relative flex items-center gap-4 rounded-[1rem] border border-[var(--color-border-default)] p-4 text-left transition-transform active:scale-[0.98]"
              style={{
                background: bundle.popular
                  ? "rgba(232,168,76,0.06)"
                  : "var(--color-surface)",
              }}
            >
              {(bundle.popular || bundle.best) && (
                <div className="absolute -top-2 right-3 rounded-full bg-[var(--color-accent-primary)] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--color-background)]">
                  {bundle.best ? "Best Value" : "Popular"}
                </div>
              )}

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-muted)]">
                <Coins
                  size={22}
                  color={
                    bundle.popular
                      ? "var(--color-accent-primary)"
                      : "var(--color-text-muted)"
                  }
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-display text-lg font-bold text-[var(--color-text-primary)]">
                    {bundle.coins.toLocaleString()}
                  </span>
                  {bundle.bonus > 0 && (
                    <span className="text-xs font-semibold text-[var(--color-status-success)]">
                      +{bundle.bonus.toLocaleString()} bonus
                    </span>
                  )}
                  <span className="text-xs text-[var(--color-text-muted)]">
                    coins
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-[var(--color-text-muted)]">
                  ≈ {Math.floor((bundle.coins + (bundle.bonus ?? 0)) / 80)}{" "}
                  chapters at 80 coins each
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-base font-bold text-[var(--color-accent-primary)]">
                  {bundle.priceCFA}
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)]">
                  CFA
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-8">
        <h3 className="mb-3 font-display text-base font-semibold text-[var(--color-text-primary)]">
          Recent Transactions
        </h3>
        <div className="flex flex-col gap-2">
          {transactionHistory.length === 0 ? (
            <EmptyState
              title="No transactions yet"
              description="Your purchase and chapter unlock history will appear here."
            />
          ) : (
            transactionHistory.map((tx) => (
              <TransactionRow
                key={tx.id}
                icon={<span>{tx.type === "CHAPTER_UNLOCK" ? "📖" : "💰"}</span>}
                label={tx.type}
                date={tx.createdAt}
                amount={tx.coins}
                tone={tx.coins > 0 ? "credit" : "debit"}
              />
            ))
          )}
        </div>
      </div>

      {showPayModal && bundleData && (
        <div className="absolute inset-0 z-50 flex items-end bg-[var(--color-surface-overlay)] backdrop-blur-sm">
          <div className="w-full rounded-t-[1.5rem] border border-[var(--color-border-default)] bg-[var(--color-surface)] px-6 pb-8 pt-4">
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-[var(--color-border-default)]" />

            {success ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(62,207,142,0.15)]">
                  <CheckCircle size={32} color="var(--color-status-success)" />
                </div>
                <p className="font-display text-xl font-bold text-[var(--color-text-primary)]">
                  Payment Successful!
                </p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {(
                    bundleData.coins + (bundleData.bonus ?? 0)
                  ).toLocaleString()}{" "}
                  Somi Coins added to your wallet
                </p>
              </div>
            ) : (
              <>
                <h3 className="mb-5 font-display text-xl font-bold text-[var(--color-text-primary)]">
                  Confirm Purchase
                </h3>

                <div className="mb-4 rounded-[1rem] bg-[var(--color-surface-muted)] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-[var(--color-text-muted)]">
                      {bundleData.name} Bundle
                    </span>
                    <span className="font-bold text-[var(--color-accent-primary)]">
                      {bundleData.priceCFA} CFA
                    </span>
                  </div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-[var(--color-text-muted)]">
                      Somi Coins
                    </span>
                    <span className="font-bold text-[var(--color-text-primary)]">
                      {bundleData.coins.toLocaleString()}
                    </span>
                  </div>
                  {bundleData.bonus > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--color-text-muted)]">
                        Bonus
                      </span>
                      <span className="font-bold text-[var(--color-status-success)]">
                        +{bundleData.bonus.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mb-4 rounded-[0.85rem] border border-[rgba(201,96,58,0.35)] bg-[rgba(201,96,58,0.08)] p-3 text-sm text-[var(--color-status-danger)]">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPayModal(false);
                      setSelectedBundle(null);
                      setProcessing(false);
                      setError(null);
                    }}
                    className="somi-quiet-button flex-1 justify-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={processing}
                    className="somi-primary-button flex-1 justify-center disabled:opacity-50"
                  >
                    {processing ? "Processing..." : "Pay now"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
