import { useState } from "react";
import { Coins, TrendingUp, Edit3, Plus, CheckCircle } from "lucide-react";
import type { CommonProps } from "../../types";

const bundles = [
  { id: "starter",  label: "Starter",  cfa: 100,  coins: 680,  popular: false, color: "#60a5fa" },
  { id: "standard", label: "Standard", cfa: 175,  coins: 1190, popular: true,  color: "#a78bfa" },
  { id: "plus",     label: "Plus",     cfa: 425,  coins: 2890, popular: false, color: "#fbbf24" },
  { id: "premium",  label: "Premium",  cfa: 850,  coins: 5780, popular: false, color: "#fb7185" },
];

const recentTx = [
  { user: "Amara D.",  type: "purchase", bundle: "Standard", coins: 1190, time: "3m ago" },
  { user: "Kwame M.",  type: "unlock",   bundle: "Ch.6 Baobab", coins: -80, time: "12m ago" },
  { user: "Fatou N.",  type: "purchase", bundle: "Premium",  coins: 5780, time: "1h ago" },
  { user: "Zintle D.", type: "unlock",   bundle: "Ch.3 Kongo", coins: -120, time: "2h ago" },
  { user: "Chidi O.",  type: "purchase", bundle: "Starter",  coins: 680,  time: "3h ago" },
];

export default function AdminEconomy({ }: CommonProps) {
  const [editBundle, setEditBundle] = useState<string | null>(null);

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#0e1422" }}>
      <div className="px-5 pt-12 pb-5">
        <p className="text-xs uppercase tracking-widest font-bold mb-0.5" style={{ color: "#60a5fa88" }}>Admin Console</p>
        <h1 className="font-display text-2xl font-bold" style={{ color: "#f0ece4" }}>Economy</h1>
      </div>

      {/* Summary KPIs */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Coins Sold",    value: "892k", icon: <Coins      size={14} color="#fbbf24" /> },
            { label: "Coins Spent",   value: "654k", icon: <TrendingUp size={14} color="#4ade80" /> },
            { label: "Revenue (CFA)", value: "3.2M", icon: <CheckCircle size={14} color="#60a5fa" /> },
          ].map(k => (
            <div key={k.label} className="p-3 rounded-xl text-center" style={{ background: "#162035" }}>
              <div className="flex justify-center mb-1">{k.icon}</div>
              <p className="font-display text-lg font-bold" style={{ color: "#f0ece4" }}>{k.value}</p>
              <p className="text-[8px] mt-0.5" style={{ color: "#3b5278" }}>{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rate display */}
      <div
        className="mx-5 mb-5 p-3 rounded-xl flex items-center gap-3"
        style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}
      >
        <Coins size={18} color="#fbbf24" />
        <div>
          <p className="text-xs font-bold" style={{ color: "#fbbf24" }}>Exchange Rate</p>
          <p className="text-sm font-semibold" style={{ color: "#f0ece4" }}>1 CFA = 6.8 Somi Coins</p>
        </div>
        <button className="ml-auto p-1.5 rounded-lg active:scale-95" style={{ background: "rgba(251,191,36,0.12)" }}>
          <Edit3 size={13} color="#fbbf24" />
        </button>
      </div>

      {/* Bundle management */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-base font-semibold" style={{ color: "#f0ece4" }}>Coin Bundles</h3>
          <button
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95"
            style={{ background: "rgba(96,165,250,0.12)", color: "#60a5fa" }}
          >
            <Plus size={12} /> New Bundle
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {bundles.map(bundle => (
            <div key={bundle.id}>
              <div
                className="p-4 rounded-xl"
                style={{
                  background: "#162035",
                  border: editBundle === bundle.id
                    ? `1px solid ${bundle.color}`
                    : "1px solid rgba(96,165,250,0.1)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
                      style={{ background: `${bundle.color}18`, color: bundle.color }}
                    >
                      ✦
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm" style={{ color: "#f0ece4" }}>{bundle.label}</p>
                        {bundle.popular && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${bundle.color}22`, color: bundle.color }}>
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "#3b5278" }}>
                        {bundle.cfa} CFA → <span style={{ color: bundle.color }}>{bundle.coins.toLocaleString()} coins</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditBundle(editBundle === bundle.id ? null : bundle.id)}
                    className="p-2 rounded-lg active:scale-90"
                    style={{ background: "rgba(96,165,250,0.08)" }}
                  >
                    <Edit3 size={13} color="#60a5fa" />
                  </button>
                </div>

                {editBundle === bundle.id && (
                  <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(96,165,250,0.1)" }}>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] uppercase tracking-wider font-bold block mb-1.5" style={{ color: "#3b5278" }}>Price (CFA)</label>
                        <input
                          defaultValue={bundle.cfa}
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ background: "#0e1422", color: "#f0ece4", border: "1px solid rgba(96,165,250,0.2)" }}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase tracking-wider font-bold block mb-1.5" style={{ color: "#3b5278" }}>Coins</label>
                        <input
                          defaultValue={bundle.coins}
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ background: "#0e1422", color: "#f0ece4", border: "1px solid rgba(96,165,250,0.2)" }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setEditBundle(null)}
                        className="flex-1 py-2 rounded-lg text-xs font-bold active:scale-95"
                        style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80" }}
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setEditBundle(null)}
                        className="px-4 py-2 rounded-lg text-xs active:scale-95"
                        style={{ background: "rgba(96,165,250,0.08)", color: "#60a5fa" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="px-5 pb-8">
        <h3 className="font-display text-base font-semibold mb-3" style={{ color: "#f0ece4" }}>Recent Transactions</h3>
        <div className="flex flex-col gap-2">
          {recentTx.map((tx, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "#162035" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: tx.type === "purchase" ? "rgba(74,222,128,0.12)" : "rgba(251,113,133,0.12)" }}
              >
                <Coins size={13} color={tx.type === "purchase" ? "#4ade80" : "#fb7185"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: "#f0ece4" }}>{tx.user}</p>
                <p className="text-[10px]" style={{ color: "#3b5278" }}>{tx.bundle}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p
                  className="text-sm font-bold"
                  style={{ color: tx.coins > 0 ? "#4ade80" : "#fb7185" }}
                >
                  {tx.coins > 0 ? "+" : ""}{tx.coins.toLocaleString()}
                </p>
                <p className="text-[9px]" style={{ color: "#3b5278" }}>{tx.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
