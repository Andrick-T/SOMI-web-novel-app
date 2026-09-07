import { useEffect, useState } from "react";
import {
  BookOpen,
  Users,
  TrendingUp,
  Coins,
  Clock,
  PenLine,
  ChevronRight,
  Zap,
} from "lucide-react";
import type { CommonProps } from "../../types";
import { writerRepository } from "../../features/writer";
import {
  apiWriterRepository,
  useApiWriterContent,
} from "../../services/repositories/writerRepository";
import { statusToneFor } from "../../config/designSystem";
import { StatusBadge } from "../../components/DesignPrimitives";

export default function WriterDashboard({ navigate }: CommonProps) {
  const [books, setBooks] = useState(() =>
    useApiWriterContent ? [] : writerRepository.getWriterBooks(),
  );
  const [earnings, setEarnings] = useState(0);
  const [loading, setLoading] = useState(useApiWriterContent);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!useApiWriterContent) return;
    let cancelled = false;
    Promise.all([
      apiWriterRepository.getWriterBooks(),
      apiWriterRepository.getEarnings(),
    ])
      .then(([nextBooks, nextEarnings]) => {
        if (cancelled) return;
        setBooks(nextBooks);
        setEarnings(
          typeof nextEarnings.availableCoins === "number"
            ? nextEarnings.availableCoins
            : 0,
        );
      })
      .catch((caught) => {
        if (!cancelled) {
          setLoadError(
            caught instanceof Error
              ? caught.message
              : "Unable to load Writer data.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useApiWriterContent
    ? {
        draftCount: books.filter((book) => book.status === "DRAFT").length,
        inReviewCount: books.filter((book) =>
          ["READY_FOR_REVIEW", "SUBMITTED"].includes(book.status),
        ).length,
        scheduledCount: books.filter((book) => book.status === "SCHEDULED")
          .length,
        publishedCount: books.filter((book) => book.status === "PUBLISHED")
          .length,
        totalReaders: 0,
        totalEarnings: earnings,
      }
    : writerRepository.getDashboardSummary();
  const drafts = books
    .flatMap((book) =>
      book.chapters
        .filter((chapter) =>
          ["DRAFT", "EDITING", "PROOFREADING", "READY_FOR_REVIEW"].includes(
            chapter.status,
          ),
        )
        .map((chapter) => ({
          id: chapter.id,
          title: chapter.title,
          book: book.title,
          wordCount: chapter.wordCount,
          progress: Math.max(25, Math.min(90, chapter.wordCount / 25)),
          bookId: book.id,
        })),
    )
    .slice(0, 2);

  const stats = [
    {
      label: "Books",
      value: String(books.length),
      sub: `${summary.publishedCount} published`,
      icon: <BookOpen size={18} color="#4ade80" />,
    },
    {
      label: "Drafts",
      value: String(summary.draftCount),
      sub: `${summary.inReviewCount} in review`,
      icon: <PenLine size={18} color="#4ade80" />,
    },
    {
      label: "Readers",
      value: `${(summary.totalReaders / 1000).toFixed(1)}k`,
      sub: useApiWriterContent ? "Live data unavailable" : "+18% this week",
      icon: <Users size={18} color="#4ade80" />,
    },
    {
      label: "Earnings",
      value: `${summary.totalEarnings.toLocaleString()} coins`,
      sub: useApiWriterContent ? "available now" : "available now",
      icon: <Coins size={18} color="#e8a84c" />,
    },
  ];

  return (
    <div
      className="flex flex-col min-h-full"
      style={{ background: "var(--color-background)" }}
    >
      <div className="px-5 pt-12 pb-5">
        <div className="flex items-center justify-between mb-1">
          <div>
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
              Dashboard
            </h1>
          </div>
          <button
            onClick={() => navigate("writer-create")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform"
            style={{
              background: "var(--color-accent-primary)",
              color: "var(--color-background)",
            }}
          >
            <PenLine size={14} />
            New Book
          </button>
        </div>
      </div>

      {loading ? (
        <div className="px-5 py-8 text-sm" style={{ color: "#6a8060" }}>
          Loading Writer data...
        </div>
      ) : loadError ? (
        <div className="px-5 py-8 text-sm" style={{ color: "#fb7185" }}>
          {loadError}
        </div>
      ) : null}

      <div className="px-5 mb-6">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-4"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border-default)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                {s.icon}
                <span
                  className="text-[10px] uppercase tracking-widest font-bold"
                  style={{ color: "#4a6540" }}
                >
                  {s.label}
                </span>
              </div>
              <p
                className="font-display text-2xl font-bold"
                style={{ color: "#f0ece4" }}
              >
                {s.value}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "#6a8060" }}>
                {s.sub}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3
            className="font-display text-base font-semibold"
            style={{ color: "#f0ece4" }}
          >
            Continue writing
          </h3>
          <button
            className="flex items-center gap-1 text-xs"
            style={{ color: "#4ade80" }}
            onClick={() => navigate("writer-books")}
          >
            See all <ChevronRight size={12} />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {drafts.length === 0 && !loading && !loadError && (
            <p className="text-sm" style={{ color: "#6a8060" }}>
              No drafts yet.
            </p>
          )}
          {drafts.map((d) => (
            <button
              key={d.id}
              onClick={() => navigate("writer-editor", d.bookId, d.id)}
              className="p-4 rounded-xl text-left active:scale-[0.98] transition-transform"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border-default)",
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p
                    className="font-semibold text-sm"
                    style={{ color: "#f0ece4" }}
                  >
                    {d.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#6a8060" }}>
                    {d.book}
                  </p>
                </div>
                <StatusBadge
                  label="Draft"
                  tone={statusToneFor("DRAFT")}
                  compact
                />
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="flex-1 h-1 rounded-full overflow-hidden"
                  style={{ background: "#2a3525" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(d.progress, 90)}%`,
                      background: "#4ade80",
                    }}
                  />
                </div>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: "#4ade80" }}
                >
                  {Math.round(d.progress)}%
                </span>
                <div className="flex items-center gap-1">
                  <Clock size={9} color="#6a8060" />
                  <span className="text-[10px]" style={{ color: "#6a8060" }}>
                    {d.wordCount.toLocaleString()} w
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mb-6">
        <h3
          className="font-display text-base font-semibold mb-3"
          style={{ color: "#f0ece4" }}
        >
          Publishing pipeline
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Drafts", value: summary.draftCount },
            { label: "In review", value: summary.inReviewCount },
            { label: "Scheduled", value: summary.scheduledCount },
            { label: "Published", value: summary.publishedCount },
          ].map((item) => (
            <div
              key={item.label}
              className="p-3 rounded-xl"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border-default)",
              }}
            >
              <p
                className="text-[10px] uppercase tracking-wider"
                style={{ color: "#4a6540" }}
              >
                {item.label}
              </p>
              <p
                className="mt-2 font-display text-2xl font-bold"
                style={{ color: "#f0ece4" }}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 mb-6">
        <h3
          className="font-display text-base font-semibold mb-3"
          style={{ color: "#f0ece4" }}
        >
          Quick actions
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "New Book",
              icon: <BookOpen size={18} />,
              action: () => navigate("writer-create"),
            },
            {
              label: "My Books",
              icon: <PenLine size={18} />,
              action: () => navigate("writer-books"),
            },
            {
              label: "Analytics",
              icon: <TrendingUp size={18} />,
              action: () => navigate("writer-analytics"),
            },
            {
              label: "Schedule",
              icon: <Clock size={18} />,
              action: () => navigate("writer-books"),
            },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="flex items-center gap-3 p-3 rounded-xl active:scale-95 transition-transform"
              style={{
                background: "#1e2118",
                border: "1px solid #2a3525",
                color: "#4ade80",
              }}
            >
              {item.icon}
              <span
                className="text-sm font-semibold"
                style={{ color: "#f0ece4" }}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-8">
        <h3
          className="font-display text-base font-semibold mb-3"
          style={{ color: "#f0ece4" }}
        >
          Recent activity
        </h3>
        <p className="text-sm" style={{ color: "#6a8060" }}>
          Activity updates will appear here when available.
        </p>
      </div>

      <div className="mx-5 mb-8">
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{
            background: "linear-gradient(135deg, #1e2118, #252f1e)",
            border: "1px solid rgba(74,222,128,0.2)",
          }}
        >
          <Zap size={20} color="#4ade80" />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#f0ece4" }}>
              Keep the momentum!
            </p>
            <p className="text-xs" style={{ color: "#6a8060" }}>
              Your last chapter was updated 3 days ago.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
