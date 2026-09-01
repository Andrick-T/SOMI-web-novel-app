import { BookOpen, Users, TrendingUp, Coins, Clock, PenLine, Bell, ChevronRight, Zap } from "lucide-react";
import type { CommonProps } from "../../types";

const stats = [
  { label: "Books",    value: "3",    sub: "2 ongoing",      icon: <BookOpen size={18} color="#4ade80" /> },
  { label: "Chapters", value: "87",   sub: "5 scheduled",    icon: <PenLine  size={18} color="#4ade80" /> },
  { label: "Readers",  value: "4.2k", sub: "+234 this week", icon: <Users    size={18} color="#4ade80" /> },
  { label: "Unlocks",  value: "3.8k", sub: "this month",     icon: <Coins    size={18} color="#e8a84c" /> },
];

const recentActivity = [
  { type: "unlock",  text: "Ch.6 «The Baobab Kingdom» unlocked",  time: "2m ago",  icon: <Coins  size={12} color="#e8a84c" /> },
  { type: "reader",  text: "New reader started «Echoes of Kongo»", time: "14m ago", icon: <Users  size={12} color="#4ade80" /> },
  { type: "comment", text: "New comment on «Shadow Hunters» Ch.2", time: "1h ago",  icon: <Bell   size={12} color="#60a5fa" /> },
  { type: "unlock",  text: "Ch.8 «Midnight Throne» unlocked",      time: "2h ago",  icon: <Coins  size={12} color="#e8a84c" /> },
  { type: "reader",  text: "72 readers joined this week",           time: "today",   icon: <TrendingUp size={12} color="#4ade80" /> },
];

const drafts = [
  { id: "bk-c9",  title: "The Root Bleeds Gold",  book: "The Baobab Kingdom",  wordCount: 2100, progress: 70 },
  { id: "gf-c4",  title: "The River Man Returns",  book: "Grandmother's Fire",  wordCount: 850,  progress: 28 },
];

export default function WriterDashboard({ navigate }: CommonProps) {
  return (
    <div className="flex flex-col min-h-full" style={{ background: "#131510" }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-5">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-xs uppercase tracking-widest font-bold mb-0.5" style={{ color: "#4ade8088" }}>Writer Studio</p>
            <h1 className="font-display text-2xl font-bold" style={{ color: "#f0ece4" }}>Dashboard</h1>
          </div>
          <button
            onClick={() => navigate("writer-create")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform"
            style={{ background: "#4ade80", color: "#0d1208" }}
          >
            <PenLine size={14} />
            New Chapter
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-2 gap-3">
          {stats.map(s => (
            <div
              key={s.label}
              className="rounded-xl p-4"
              style={{ background: "#1e2118", border: "1px solid rgba(74,222,128,0.12)" }}
            >
              <div className="flex items-center justify-between mb-2">
                {s.icon}
                <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "#4a6540" }}>
                  {s.label}
                </span>
              </div>
              <p className="font-display text-2xl font-bold" style={{ color: "#f0ece4" }}>{s.value}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#6a8060" }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Drafts in progress */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-base font-semibold" style={{ color: "#f0ece4" }}>Drafts in Progress</h3>
          <button className="flex items-center gap-1 text-xs" style={{ color: "#4ade80" }} onClick={() => navigate("writer-books")}>
            See all <ChevronRight size={12} />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {drafts.map(d => (
            <button
              key={d.id}
              onClick={() => navigate("writer-editor")}
              className="p-4 rounded-xl text-left active:scale-[0.98] transition-transform"
              style={{ background: "#1e2118", border: "1px solid #2a3525" }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm" style={{ color: "#f0ece4" }}>{d.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#6a8060" }}>{d.book}</p>
                </div>
                <div
                  className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase"
                  style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80" }}
                >
                  Draft
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "#2a3525" }}>
                  <div className="h-full rounded-full" style={{ width: `${d.progress}%`, background: "#4ade80" }} />
                </div>
                <span className="text-[10px] font-bold" style={{ color: "#4ade80" }}>{d.progress}%</span>
                <div className="flex items-center gap-1">
                  <Clock size={9} color="#6a8060" />
                  <span className="text-[10px]" style={{ color: "#6a8060" }}>{d.wordCount.toLocaleString()} w</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-5 mb-6">
        <h3 className="font-display text-base font-semibold mb-3" style={{ color: "#f0ece4" }}>Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "New Book",      icon: <BookOpen size={18} />, action: () => navigate("writer-create") },
            { label: "My Books",      icon: <PenLine  size={18} />, action: () => navigate("writer-books") },
            { label: "Analytics",     icon: <TrendingUp size={18} />, action: () => navigate("writer-analytics") },
            { label: "Schedule",      icon: <Clock    size={18} />, action: () => navigate("writer-books") },
          ].map(item => (
            <button
              key={item.label}
              onClick={item.action}
              className="flex items-center gap-3 p-3 rounded-xl active:scale-95 transition-transform"
              style={{ background: "#1e2118", border: "1px solid #2a3525", color: "#4ade80" }}
            >
              {item.icon}
              <span className="text-sm font-semibold" style={{ color: "#f0ece4" }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="px-5 pb-8">
        <h3 className="font-display text-base font-semibold mb-3" style={{ color: "#f0ece4" }}>Recent Activity</h3>
        <div className="flex flex-col gap-2">
          {recentActivity.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "#1e2118" }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "#2a3525" }}
              >
                {item.icon}
              </div>
              <p className="text-xs flex-1 leading-snug" style={{ color: "#a8c0a0" }}>{item.text}</p>
              <span className="text-[9px] flex-shrink-0" style={{ color: "#4a6540" }}>{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Motivation banner */}
      <div className="mx-5 mb-8">
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: "linear-gradient(135deg, #1e2118, #252f1e)", border: "1px solid rgba(74,222,128,0.2)" }}
        >
          <Zap size={20} color="#4ade80" />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#f0ece4" }}>Keep the momentum!</p>
            <p className="text-xs" style={{ color: "#6a8060" }}>Your last chapter was 3 days ago</p>
          </div>
        </div>
      </div>
    </div>
  );
}
