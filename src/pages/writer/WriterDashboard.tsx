import { useEffect, useState } from "react";

import {
  BookOpen,
  ChevronRight,
  Clock,
  Coins,
  PenLine,
  TrendingUp,
  Users,
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
    .slice(0, 3);

  const stats = [
    {
      label: "Books",
      value: String(books.length),
      sub: `${summary.publishedCount} published`,
      icon: <BookOpen size={17} />,
    },
    {
      label: "Drafts",
      value: String(summary.draftCount),
      sub: `${summary.inReviewCount} in review`,
      icon: <PenLine size={17} />,
    },
    {
      label: "Readers",
      value: `${(summary.totalReaders / 1000).toFixed(1)}k`,
      sub: useApiWriterContent
        ? "Live reader data unavailable"
        : "+18% this week",
      icon: <Users size={17} />,
    },
    {
      label: "Earnings",
      value: `${summary.totalEarnings.toLocaleString()}`,
      sub: "coins available",
      icon: <Coins size={17} />,
    },
  ];

  const pipeline = [
    {
      label: "Drafts",
      value: summary.draftCount,
    },
    {
      label: "In review",
      value: summary.inReviewCount,
    },
    {
      label: "Scheduled",
      value: summary.scheduledCount,
    },
    {
      label: "Published",
      value: summary.publishedCount,
    },
  ];

  const quickActions = [
    {
      label: "New Book",
      icon: <BookOpen size={17} />,
      action: () => navigate("writer-create"),
    },
    {
      label: "My Books",
      icon: <PenLine size={17} />,
      action: () => navigate("writer-books"),
    },
    {
      label: "Analytics",
      icon: <TrendingUp size={17} />,
      action: () => navigate("writer-analytics"),
    },
    {
      label: "Earnings",
      icon: <Coins size={17} />,
      action: () => navigate("writer-earnings"),
    },
  ];

  return (
    <div className="somi-writer-page">
      <div className="somi-writer-inner">
        {/* =====================================================
            PAGE HEADER
           ===================================================== */}

        <header className="somi-writer-header">
          <div>
            <p className="somi-writer-eyebrow">Writer Studio</p>

            <h1 className="somi-writer-title">Your stories, in motion.</h1>

            <p className="somi-writer-description">
              Write, manage, publish and track the stories you are building on
              SOMI.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("writer-create")}
            className="somi-writer-primary-action"
          >
            <PenLine size={15} />
            New Book
          </button>
        </header>

        {/* =====================================================
            LOADING / ERROR
           ===================================================== */}

        {loading && (
          <div className="somi-writer-section">
            <p className="somi-writer-empty">Loading your Writer Studio...</p>
          </div>
        )}

        {loadError && (
          <div className="somi-writer-section">
            <p
              className="somi-writer-empty"
              style={{ color: "var(--color-status-danger)" }}
            >
              {loadError}
            </p>
          </div>
        )}

        {/* =====================================================
            OVERVIEW
           ===================================================== */}

        <section className="somi-writer-section">
          <div className="somi-writer-section-header">
            <h2 className="somi-writer-section-title">Your work</h2>
          </div>

          <div className="somi-writer-stats">
            {stats.map((stat) => (
              <div key={stat.label} className="somi-writer-stat">
                <div className="somi-writer-stat-label">
                  <span className="somi-writer-action-icon" aria-hidden="true">
                    {stat.icon}
                  </span>

                  {stat.label}
                </div>

                <div className="somi-writer-stat-value">
                  {stat.value}
                  {stat.label === "Earnings" && (
                    <span
                      style={{
                        marginLeft: "0.3rem",
                        fontFamily: '"Nunito", sans-serif',
                        fontSize: "0.7rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      coins
                    </span>
                  )}
                </div>

                <p className="somi-writer-stat-sub">{stat.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================
            CONTINUE WRITING
           ===================================================== */}

        <section className="somi-writer-section">
          <div className="somi-writer-section-header">
            <h2 className="somi-writer-section-title">Continue writing</h2>

            <button
              type="button"
              className="somi-writer-section-link"
              onClick={() => navigate("writer-books")}
            >
              See all
              <ChevronRight size={13} />
            </button>
          </div>

          {drafts.length === 0 ? (
            <div className="somi-writer-empty">
              No chapters need your attention right now.
            </div>
          ) : (
            <div className="somi-writer-list">
              {drafts.map((draft) => (
                <button
                  key={draft.id}
                  type="button"
                  onClick={() =>
                    navigate("writer-editor", draft.bookId, draft.id)
                  }
                  className="somi-writer-list-item"
                >
                  <div className="somi-writer-list-main">
                    <div className="flex items-center gap-2">
                      <p className="somi-writer-list-title">{draft.title}</p>

                      <StatusBadge
                        label="Draft"
                        tone={statusToneFor("DRAFT")}
                        compact
                      />
                    </div>

                    <p className="somi-writer-list-meta">{draft.book}</p>

                    <div className="somi-writer-progress">
                      <div className="somi-writer-progress-track">
                        <div
                          className="somi-writer-progress-fill"
                          style={{
                            width: `${Math.min(draft.progress, 90)}%`,
                          }}
                        />
                      </div>

                      <span className="somi-writer-progress-value">
                        {Math.round(draft.progress)}%
                      </span>
                    </div>
                  </div>

                  <span className="somi-writer-word-count">
                    <Clock size={11} />
                    {draft.wordCount.toLocaleString()} words
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* =====================================================
            PUBLISHING PIPELINE
           ===================================================== */}

        <section className="somi-writer-section">
          <div className="somi-writer-section-header">
            <h2 className="somi-writer-section-title">Publishing pipeline</h2>
          </div>

          <div className="somi-writer-pipeline">
            {pipeline.map((item) => (
              <div key={item.label} className="somi-writer-pipeline-item">
                <p className="somi-writer-pipeline-label">{item.label}</p>

                <p className="somi-writer-pipeline-value">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================
            QUICK ACTIONS
           ===================================================== */}

        <section className="somi-writer-section">
          <div className="somi-writer-section-header">
            <h2 className="somi-writer-section-title">Quick actions</h2>
          </div>

          <div className="somi-writer-actions">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.action}
                className="somi-writer-action"
              >
                <span className="somi-writer-action-icon" aria-hidden="true">
                  {action.icon}
                </span>

                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* =====================================================
            RECENT ACTIVITY
           ===================================================== */}

        <section className="somi-writer-section">
          <div className="somi-writer-section-header">
            <h2 className="somi-writer-section-title">Recent activity</h2>
          </div>

          <div className="somi-writer-empty">
            Activity updates will appear here when available.
          </div>
        </section>

        {/* =====================================================
            WRITING PROMPT
           ===================================================== */}

        <div className="somi-writer-notice">
          <Zap size={18} className="somi-writer-notice-icon" />

          <div>
            <p className="somi-writer-notice-title">Keep the momentum.</p>

            <p className="somi-writer-notice-text">
              Your writing workspace is ready whenever the next chapter is.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
