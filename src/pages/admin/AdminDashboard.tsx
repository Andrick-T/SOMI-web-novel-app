import { Users, BookOpen, Coins, TrendingUp, ShieldAlert, CheckCircle, Clock } from "lucide-react";
import type { CommonProps } from "../../types";

const kpis = [
  { label: "Total Users",    value: "18.4k", delta: "+320",  icon: <Users    size={16} color="#60a5fa" /> },
  { label: "Active Writers", value: "234",   delta: "+12",   icon: <BookOpen size={16} color="#60a5fa" /> },
  { label: "Total Books",    value: "1,287", delta: "+48",   icon: <BookOpen size={16} color="#a78bfa" /> },
  { label: "Coins Spent",    value: "892k",  delta: "+14%",  icon: <Coins    size={16} color="#fbbf24" /> },
];

const recentFlags = [
  { type: "content", text: "Flagged: «Dark River» Ch.4 — adult content", time: "5m ago",  status: "pending" },
  { type: "user",    text: "Account report: spam comments from user #9821", time: "22m ago", status: "pending" },
  { type: "content", text: "Book removed: «Hidden Throne» — plagiarism",  time: "1h ago",  status: "resolved" },
  { type: "economy", text: "Suspicious coin purchase: 50k coins in 1 tx",  time: "3h ago",  status: "reviewing" },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  pending:   { bg: "rgba(251,191,36,0.12)",  text: "#fbbf24" },
  resolved:  { bg: "rgba(74,222,128,0.12)",  text: "#4ade80" },
  reviewing: { bg: "rgba(96,165,250,0.12)",  text: "#60a5fa" },
};

export default function AdminDashboard({ navigate }: CommonProps) {
  return (
    <div className="flex flex-col min-h-full" style={{ background: "#0e1422" }}>
      <div className="px-5 pt-12 pb-5">
        <p className="text-xs uppercase tracking-widest font-bold mb-0.5" style={{ color: "#60a5fa88" }}>Admin Console</p>
        <h1 className="font-display text-2xl font-bold" style={{ color: "#f0ece4" }}>Dashboard</h1>
      </div>

      {/* KPIs */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-2 gap-3">
          {kpis.map(k => (
            <div
              key={k.label}
              className="p-4 rounded-xl"
              style={{ background: "#162035", border: "1px solid rgba(96,165,250,0.12)" }}
            >
              <div className="flex items-center justify-between mb-2">
                {k.icon}
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(96,165,250,0.12)", color: "#60a5fa" }}>
                  {k.delta}
                </span>
              </div>
              <p className="font-display text-2xl font-bold" style={{ color: "#f0ece4" }}>{k.value}</p>
              <p className="text-[9px] mt-0.5" style={{ color: "#3b5278" }}>{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick nav */}
      <div className="px-5 mb-6">
        <h3 className="font-display text-sm font-semibold mb-3" style={{ color: "#f0ece4" }}>Quick Access</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Users",   icon: <Users    size={20} />, page: "admin-users"    as const },
            { label: "Content", icon: <BookOpen size={20} />, page: "admin-content"  as const },
            { label: "Economy", icon: <Coins    size={20} />, page: "admin-economy"  as const },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => navigate(item.page)}
              className="flex flex-col items-center gap-2 py-4 rounded-xl active:scale-95 transition-transform"
              style={{ background: "#162035", border: "1px solid rgba(96,165,250,0.12)", color: "#60a5fa" }}
            >
              {item.icon}
              <span className="text-xs font-semibold" style={{ color: "#a0c0e8" }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Platform health */}
      <div className="px-5 mb-6">
        <h3 className="font-display text-sm font-semibold mb-3" style={{ color: "#f0ece4" }}>Platform Health</h3>
        <div className="flex flex-col gap-2">
          {[
            { label: "API Response",   value: "98ms",  good: true },
            { label: "CDN Uptime",     value: "99.9%", good: true },
            { label: "Coin Ledger",    value: "Sync",  good: true },
            { label: "Content Queue",  value: "12 pending", good: false },
          ].map(item => (
            <div
              key={item.label}
              className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: "#162035" }}
            >
              <div className="flex items-center gap-2">
                {item.good
                  ? <CheckCircle size={14} color="#4ade80" />
                  : <Clock       size={14} color="#fbbf24" />
                }
                <span className="text-sm" style={{ color: "#a0c0e8" }}>{item.label}</span>
              </div>
              <span className="text-xs font-bold" style={{ color: item.good ? "#4ade80" : "#fbbf24" }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Moderation queue */}
      <div className="px-5 pb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-sm font-semibold" style={{ color: "#f0ece4" }}>Moderation Queue</h3>
          <button
            className="flex items-center gap-1 text-xs"
            style={{ color: "#60a5fa" }}
            onClick={() => navigate("admin-content")}
          >
            View all <ShieldAlert size={11} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {recentFlags.map((flag, i) => {
            const sc = statusColors[flag.status];
            return (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: "#162035", border: "1px solid rgba(96,165,250,0.08)" }}
              >
                <TrendingUp size={14} color="#60a5fa" className="flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-snug" style={{ color: "#a0c0e8" }}>{flag.text}</p>
                  <p className="text-[9px] mt-0.5" style={{ color: "#3b5278" }}>{flag.time}</p>
                </div>
                <span
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: sc.bg, color: sc.text }}
                >
                  {flag.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
