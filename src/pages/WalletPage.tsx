import { useState } from "react";
import { Coins, ArrowLeft, CheckCircle, Clock, TrendingUp, Zap } from "lucide-react";
import type { CommonProps } from "../types";

interface Bundle {
  id: string;
  name: string;
  priceCFA: number;
  coins: number;
  bonus?: number;
  popular?: boolean;
  best?: boolean;
}

const bundles: Bundle[] = [
  { id: "starter",  name: "Starter",  priceCFA: 100, coins: 680 },
  { id: "standard", name: "Standard", priceCFA: 175, coins: 1190, popular: true },
  { id: "plus",     name: "Plus",     priceCFA: 425, coins: 2890, bonus: 200 },
  { id: "premium",  name: "Premium",  priceCFA: 850, coins: 5780, bonus: 500, best: true },
];

const transactions = [
  { id: 1, type: "purchase", label: "Standard Bundle", coins: +1190, date: "Aug 24, 2026", icon: "💰" },
  { id: 2, type: "spend", label: "The Midnight Throne · Ch. 4", coins: -80, date: "Aug 24, 2026", icon: "📖" },
  { id: 3, type: "spend", label: "The Midnight Throne · Ch. 5", coins: -80, date: "Aug 23, 2026", icon: "📖" },
  { id: 4, type: "purchase", label: "Starter Bundle", coins: +680, date: "Aug 20, 2026", icon: "💰" },
  { id: 5, type: "spend", label: "Sins of the Father · Ch. 3", coins: -80, date: "Aug 19, 2026", icon: "📖" },
];

export default function WalletPage({ navigate, coins, addCoins, isLoggedIn }: CommonProps) {
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col min-h-full items-center justify-center px-8 text-center gap-5" style={{ background: "#0d0b18" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "#1a1726" }}>
          <Coins size={36} color="#e8a84c" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold mb-2" style={{ color: "#f0ece4" }}>Somi Wallet</h2>
          <p className="text-sm leading-relaxed" style={{ color: "#8b7ea8" }}>
            Sign in to buy Somi Coins and unlock premium chapters.
          </p>
        </div>
        <button
          onClick={() => navigate("auth")}
          className="w-full h-12 rounded-xl font-bold text-sm"
          style={{ background: "#e8a84c", color: "#0d0b18" }}
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
  };

  const handleConfirmPayment = () => {
    const bundle = bundles.find(b => b.id === selectedBundle);
    if (!bundle) return;
    setProcessing(true);
    setTimeout(() => {
      addCoins(bundle.coins + (bundle.bonus ?? 0));
      setProcessing(false);
      setSuccess(true);
      setTimeout(() => {
        setShowPayModal(false);
        setSelectedBundle(null);
        setSuccess(false);
      }, 2000);
    }, 1500);
  };

  const bundleData = bundles.find(b => b.id === selectedBundle);

  return (
    <div className="relative flex flex-col min-h-full" style={{ background: "#0d0b18" }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <h1 className="font-display text-2xl font-bold" style={{ color: "#f0ece4" }}>Wallet</h1>
        <p className="text-sm mt-1" style={{ color: "#8b7ea8" }}>Somi Coins for unlocking chapters</p>
      </div>

      {/* Balance card */}
      <div className="mx-5 mb-6">
        <div
          className="relative rounded-2xl overflow-hidden p-6"
          style={{ background: "linear-gradient(135deg, #2a1f0a 0%, #1a1400 50%, #231a06 100%)", border: "1px solid #c4882e44" }}
        >
          {/* Decorative */}
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-8 translate-x-8"
            style={{ background: "radial-gradient(circle, rgba(232,168,76,0.12) 0%, transparent 70%)" }}
          />

          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Coins size={16} color="#e8a84c" />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#e8a84c88" }}>Somi Coins</span>
            </div>
            <p className="font-display text-4xl font-bold" style={{ color: "#e8a84c" }}>
              {coins.toLocaleString()}
            </p>
            <p className="text-xs mt-2" style={{ color: "#8b7ea8" }}>
              {Math.floor(coins / 80)} chapters unlockable at 80 coins
            </p>

            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={12} color="#3ecf8e" />
                <span className="text-[11px]" style={{ color: "#3ecf8e" }}>3,150 earned this month</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap size={12} color="#c9603a" />
                <span className="text-[11px]" style={{ color: "#c9603a" }}>240 spent</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coin Bundles */}
      <div className="px-5 mb-6">
        <h3 className="font-display text-base font-semibold mb-3" style={{ color: "#f0ece4" }}>Buy Somi Coins</h3>
        <div className="flex flex-col gap-3">
          {bundles.map(bundle => (
            <button
              key={bundle.id}
              onClick={() => handleBuy(bundle.id)}
              className="relative flex items-center gap-4 p-4 rounded-xl text-left active:scale-[0.98] transition-transform"
              style={{
                background: bundle.popular ? "rgba(232,168,76,0.08)" : "#1a1726",
                border: bundle.popular ? "1px solid rgba(232,168,76,0.4)" : "1px solid #2e2945",
              }}
            >
              {/* Popular/Best badge */}
              {(bundle.popular || bundle.best) && (
                <div
                  className="absolute -top-2 right-3 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                  style={{ background: "#e8a84c", color: "#0d0b18" }}
                >
                  {bundle.best ? "Best Value" : "Popular"}
                </div>
              )}

              {/* Coin icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: bundle.popular ? "rgba(232,168,76,0.2)" : "#231f35" }}
              >
                <Coins size={22} color={bundle.popular ? "#e8a84c" : "#8b7ea8"} />
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-lg font-bold" style={{ color: "#f0ece4" }}>
                    {bundle.coins.toLocaleString()}
                  </span>
                  {bundle.bonus && (
                    <span className="text-xs font-semibold" style={{ color: "#3ecf8e" }}>
                      +{bundle.bonus.toLocaleString()} bonus
                    </span>
                  )}
                  <span className="text-xs" style={{ color: "#8b7ea8" }}>coins</span>
                </div>
                <p className="text-[10px] mt-0.5" style={{ color: "#8b7ea8" }}>
                  ≈ {Math.floor((bundle.coins + (bundle.bonus ?? 0)) / 80)} chapters at 80 coins each
                </p>
              </div>

              {/* Price */}
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-base" style={{ color: "#e8a84c" }}>{bundle.priceCFA}</p>
                <p className="text-[10px]" style={{ color: "#8b7ea8" }}>CFA</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      <div className="px-5 pb-8">
        <h3 className="font-display text-base font-semibold mb-3" style={{ color: "#f0ece4" }}>Recent Transactions</h3>
        <div className="flex flex-col gap-2">
          {transactions.map(tx => (
            <div
              key={tx.id}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "#1a1726", border: "1px solid #2e2945" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                style={{ background: "#231f35" }}
              >
                {tx.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: "#f0ece4" }}>{tx.label}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock size={9} color="#8b7ea8" />
                  <span className="text-[10px]" style={{ color: "#8b7ea8" }}>{tx.date}</span>
                </div>
              </div>
              <span
                className="font-bold text-sm flex-shrink-0"
                style={{ color: tx.coins > 0 ? "#3ecf8e" : "#c9603a" }}
              >
                {tx.coins > 0 ? "+" : ""}{tx.coins.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment modal */}
      {showPayModal && bundleData && (
        <div
          className="absolute inset-0 z-50 flex items-end"
          style={{ background: "rgba(6,4,15,0.88)", backdropFilter: "blur(6px)" }}
        >
          <div className="w-full rounded-t-2xl px-6 pt-4 pb-8" style={{ background: "#1a1726", border: "1px solid #2e2945" }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-6" style={{ background: "#2e2945" }} />

            {success ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(62,207,142,0.15)" }}>
                  <CheckCircle size={32} color="#3ecf8e" />
                </div>
                <p className="font-display text-xl font-bold" style={{ color: "#f0ece4" }}>Payment Successful!</p>
                <p className="text-sm" style={{ color: "#8b7ea8" }}>
                  {(bundleData.coins + (bundleData.bonus ?? 0)).toLocaleString()} Somi Coins added to your wallet
                </p>
              </div>
            ) : (
              <>
                <h3 className="font-display text-xl font-bold mb-5" style={{ color: "#f0ece4" }}>Confirm Purchase</h3>

                <div className="rounded-xl p-4 mb-4" style={{ background: "#231f35" }}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm" style={{ color: "#8b7ea8" }}>{bundleData.name} Bundle</span>
                    <span className="font-bold" style={{ color: "#e8a84c" }}>{bundleData.priceCFA} CFA</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm" style={{ color: "#8b7ea8" }}>Somi Coins</span>
                    <span className="font-bold" style={{ color: "#f0ece4" }}>{bundleData.coins.toLocaleString()}</span>
                  </div>
                  {bundleData.bonus && (
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: "#3ecf8e" }}>Bonus Coins</span>
                      <span className="font-bold" style={{ color: "#3ecf8e" }}>+{bundleData.bonus.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="h-px my-3" style={{ background: "#2e2945" }} />
                  <div className="flex justify-between">
                    <span className="text-sm font-bold" style={{ color: "#f0ece4" }}>Total Coins</span>
                    <span className="font-bold" style={{ color: "#e8a84c" }}>{(bundleData.coins + (bundleData.bonus ?? 0)).toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-xs mb-5 text-center" style={{ color: "#8b7ea8" }}>
                  Payment via Orange Money, MTN MoMo, or Bank Card
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPayModal(false)}
                    className="flex-1 h-12 rounded-xl text-sm font-semibold"
                    style={{ background: "#231f35", color: "#8b7ea8" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={processing}
                    className="flex-1 h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                    style={{ background: "#e8a84c", color: "#0d0b18" }}
                  >
                    {processing ? (
                      <span className="anim-pulse-soft">Processing...</span>
                    ) : (
                      `Pay ${bundleData.priceCFA} CFA`
                    )}
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
