import { TrendingUp, Users, Coins, BookOpen } from "lucide-react";
import type { CommonProps } from "../../types";

const weekData = [42, 60, 38, 85, 72, 55, 90];
const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

const topChapters = [
  { title: "Ch.6 · The Root Bleeds Gold",  book: "Baobab Kingdom",  unlocks: 380, readers: 910, drop: 12 },
  { title: "Ch.3 · The River Man Returns", book: "Grandmother's Fire", unlocks: 210, readers: 620, drop: 8 },
  { title: "Ch.8 · Midnight Passage",      book: "Baobab Kingdom",  unlocks: 155, readers: 440, drop: 23 },
];

function MiniBar({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values);
  return (
    <div className="flex items-end gap-1 h-14">
      {values.map((v, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div
            className="w-full rounded-sm"
            style={{ height: `${(v / max) * 48}px`, background: color, opacity: 0.85 }}
          />
          <span className="text-[8px]" style={{ color: "#4a6540" }}>{dayLabels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function WriterAnalytics({ }: CommonProps) {
  return (
    <div className="flex flex-col min-h-full" style={{ background: "#131510" }}>
      <div className="px-5 pt-12 pb-5">
        <p className="text-xs uppercase tracking-widest font-bold mb-0.5" style={{ color: "#4ade8088" }}>Writer Studio</p>
        <h1 className="font-display text-2xl font-bold" style={{ color: "#f0ece4" }}>Analytics</h1>
      </div>

      {/* Period toggle */}
      <div className="flex gap-2 px-5 mb-5">
        {["7 days", "30 days", "All time"].map((p, i) => (
          <button
            key={p}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{
              background: i === 0 ? "#4ade80" : "#1e2118",
              color: i === 0 ? "#0d1208" : "#6a8060",
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="px-5 mb-5">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total Readers",   value: "4.2k",  delta: "+18%", icon: <Users    size={16} color="#4ade80" /> },
            { label: "Chapter Unlocks", value: "3.8k",  delta: "+12%", icon: <Coins    size={16} color="#e8a84c" /> },
            { label: "Chapters Live",   value: "22",    delta: "+5",   icon: <BookOpen size={16} color="#60a5fa" /> },
            { label: "Retention",       value: "71%",   delta: "+3pt", icon: <TrendingUp size={16} color="#fb7185" /> },
          ].map(kpi => (
            <div
              key={kpi.label}
              className="p-4 rounded-xl"
              style={{ background: "#1e2118", border: "1px solid rgba(74,222,128,0.1)" }}
            >
              <div className="flex items-center justify-between mb-2">
                {kpi.icon}
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80" }}>
                  {kpi.delta}
                </span>
              </div>
              <p className="font-display text-2xl font-bold" style={{ color: "#f0ece4" }}>{kpi.value}</p>
              <p className="text-[9px] mt-0.5" style={{ color: "#4a6540" }}>{kpi.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Readers chart */}
      <div className="mx-5 mb-5 p-4 rounded-xl" style={{ background: "#1e2118", border: "1px solid #2a3525" }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold" style={{ color: "#f0ece4" }}>Readers this week</p>
          <span className="text-xs font-bold" style={{ color: "#4ade80" }}>+18%</span>
        </div>
        <MiniBar values={weekData} color="#4ade80" />
      </div>

      {/* Top chapters */}
      <div className="px-5 mb-8">
        <h3 className="font-display text-base font-semibold mb-3" style={{ color: "#f0ece4" }}>Top Chapters</h3>
        <div className="flex flex-col gap-3">
          {topChapters.map((ch, i) => (
            <div
              key={i}
              className="p-4 rounded-xl"
              style={{ background: "#1e2118", border: "1px solid #2a3525" }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#f0ece4" }}>{ch.title}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#4a6540" }}>{ch.book}</p>
                </div>
                <span
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80" }}
                >
                  #{i + 1}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Unlocks", value: ch.unlocks, color: "#e8a84c" },
                  { label: "Readers", value: ch.readers, color: "#4ade80" },
                  { label: "Drop-off", value: `${ch.drop}%`, color: "#fb7185" },
                ].map(stat => (
                  <div key={stat.label} className="text-center">
                    <p className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-[9px]" style={{ color: "#4a6540" }}>{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Drop-off bar */}
              <div className="mt-3">
                <div className="flex justify-between mb-1">
                  <span className="text-[9px]" style={{ color: "#4a6540" }}>Completion rate</span>
                  <span className="text-[9px] font-bold" style={{ color: "#4ade80" }}>{100 - ch.drop}%</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "#2a3525" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${100 - ch.drop}%`, background: "linear-gradient(90deg, #4ade80, #22c55e)" }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
