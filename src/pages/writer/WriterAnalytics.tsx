import { TrendingUp, Users, Coins, BookOpen } from "lucide-react";
import type { CommonProps } from "../../types";
import { writerRepository } from "../../features/writer";
import MiniBarChart from "../../components/MiniBarChart";
import { statusToneFor } from "../../config/designSystem";
import { StatusBadge } from "../../components/DesignPrimitives";
import { useApiWriterContent } from "../../services/repositories/writerRepository";

const weekData = [42, 60, 38, 85, 72, 55, 90];
const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

export default function WriterAnalytics({}: CommonProps) {
  if (useApiWriterContent) {
    return (
      <div
        className="flex min-h-full flex-col px-5 pt-12"
        style={{ background: "var(--color-background)" }}
      >
        <p
          className="text-xs uppercase tracking-widest font-bold mb-0.5"
          style={{ color: "var(--color-accent-primary)" }}
        >
          Writer Studio
        </p>
        <h1
          className="font-display text-2xl font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Analytics
        </h1>
        <p className="mt-6 text-sm" style={{ color: "#6a8060" }}>
          Analytics data is not available from the Writer API yet.
        </p>
      </div>
    );
  }
  const analytics = writerRepository.getAnalytics();
  const earnings = writerRepository.getEarnings();
  const chapterStats = analytics.map((item) => ({
    bookId: item.bookId,
    title: writerRepository.getBook(item.bookId)?.title ?? "Untitled",
    views: item.views,
    readers: item.uniqueReaders,
    completion: item.completionRate,
    earnings: item.earnings,
  }));

  return (
    <div
      className="flex flex-col min-h-full"
      style={{ background: "var(--color-background)" }}
    >
      <div className="px-5 pt-12 pb-5">
        <p
          className="text-xs uppercase tracking-widest font-bold mb-0.5"
          style={{ color: "var(--color-accent-primary)" }}
        >
          Writer Studio
        </p>
        <h1
          className="font-display text-2xl font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Analytics
        </h1>
      </div>

      <div className="flex gap-2 px-5 mb-5">
        {["7 days", "30 days", "All time"].map((p, i) => (
          <button
            key={p}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{
              background:
                i === 0
                  ? "var(--color-accent-primary)"
                  : "var(--color-surface)",
              color:
                i === 0 ? "var(--color-background)" : "var(--color-text-muted)",
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="px-5 mb-5">
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Total readers",
              value: `${(analytics.reduce((sum, item) => sum + item.uniqueReaders, 0) / 1000).toFixed(1)}k`,
              delta: "+18%",
              icon: <Users size={16} color="#4ade80" />,
            },
            {
              label: "Chapter unlocks",
              value: `${(analytics.reduce((sum, item) => sum + item.chapterReads, 0) / 1000).toFixed(1)}k`,
              delta: "+12%",
              icon: <Coins size={16} color="#e8a84c" />,
            },
            {
              label: "Chapters live",
              value: String(analytics.length * 2),
              delta: "+5",
              icon: <BookOpen size={16} color="#60a5fa" />,
            },
            {
              label: "Retention",
              value: `${Math.round(analytics.reduce((sum, item) => sum + item.completionRate, 0) / analytics.length)}%`,
              delta: "+3pt",
              icon: <TrendingUp size={16} color="#fb7185" />,
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="p-4 rounded-xl"
              style={{
                background: "#1e2118",
                border: "1px solid rgba(74,222,128,0.1)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                {kpi.icon}
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: "rgba(74,222,128,0.12)",
                    color: "#4ade80",
                  }}
                >
                  {kpi.delta}
                </span>
              </div>
              <p
                className="font-display text-2xl font-bold"
                style={{ color: "#f0ece4" }}
              >
                {kpi.value}
              </p>
              <p className="text-[9px] mt-0.5" style={{ color: "#4a6540" }}>
                {kpi.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        className="mx-5 mb-5 p-4 rounded-xl"
        style={{ background: "#1e2118", border: "1px solid #2a3525" }}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold" style={{ color: "#f0ece4" }}>
            Readers this week
          </p>
          <span className="text-xs font-bold" style={{ color: "#4ade80" }}>
            +18%
          </span>
        </div>
        <MiniBarChart
          values={weekData}
          labels={dayLabels}
          color="#4ade80"
          labelColor="#4a6540"
        />
      </div>

      <div className="px-5 mb-8">
        <h3
          className="font-display text-base font-semibold mb-3"
          style={{ color: "#f0ece4" }}
        >
          Top books
        </h3>
        <div className="flex flex-col gap-3">
          {chapterStats.map((book, i) => (
            <div
              key={book.bookId}
              className="p-4 rounded-xl"
              style={{ background: "#1e2118", border: "1px solid #2a3525" }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "#f0ece4" }}
                  >
                    {book.title}
                  </p>
                  <p
                    className="text-[10px] mt-0.5"
                    style={{ color: "#4a6540" }}
                  >
                    Chapters live
                  </p>
                </div>
                <StatusBadge
                  label={`#${i + 1}`}
                  tone={statusToneFor("APPROVED")}
                  compact
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Views", value: book.views, color: "#e8a84c" },
                  { label: "Readers", value: book.readers, color: "#4ade80" },
                  {
                    label: "Earnings",
                    value: `$${book.earnings}`,
                    color: "#60a5fa",
                  },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p
                      className="text-sm font-bold"
                      style={{ color: stat.color }}
                    >
                      {stat.value}
                    </p>
                    <p className="text-[9px]" style={{ color: "#4a6540" }}>
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <div className="flex justify-between mb-1">
                  <span className="text-[9px]" style={{ color: "#4a6540" }}>
                    Completion
                  </span>
                  <span
                    className="text-[9px] font-bold"
                    style={{ color: "#4ade80" }}
                  >
                    {book.completion}%
                  </span>
                </div>
                <div
                  className="h-1 rounded-full overflow-hidden"
                  style={{ background: "#2a3525" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${book.completion}%`,
                      background: "linear-gradient(90deg, #4ade80, #22c55e)",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 pb-8">
        <div
          className="rounded-xl p-4"
          style={{ background: "#1e2118", border: "1px solid #2a3525" }}
        >
          <p
            className="text-[10px] uppercase tracking-wider"
            style={{ color: "#4a6540" }}
          >
            Writer earnings
          </p>
          <div className="mt-3 flex justify-between">
            <div>
              <p
                className="font-display text-2xl font-bold"
                style={{ color: "#f0ece4" }}
              >
                $ {earnings.netEarnings.toLocaleString()}
              </p>
              <p className="text-[10px]" style={{ color: "#6a8060" }}>
                Net earnings
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold" style={{ color: "#4ade80" }}>
                $ {earnings.available.toLocaleString()}
              </p>
              <p className="text-[10px]" style={{ color: "#6a8060" }}>
                Available
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
