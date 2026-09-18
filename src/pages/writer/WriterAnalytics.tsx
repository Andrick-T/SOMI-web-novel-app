import { useEffect, useMemo, useState } from "react";
import { BookOpen, Eye, LockKeyhole, RefreshCw, Users } from "lucide-react";
import type { CommonProps } from "../../types";
import { writerRepository } from "../../features/writer";
import type { WriterAnalytics } from "../../features/writer/types";
import {
  apiWriterRepository,
  useApiWriterContent,
} from "../../services/repositories/writerRepository";

type ApiAnalytics = {
  bookId: string;
  views: number;
  readers: number;
  unlocks: number;
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) =>
  `${Math.round(Math.max(0, Math.min(100, value)))}%`;

export default function WriterAnalytics({}: CommonProps) {
  const [analytics, setAnalytics] = useState<ApiAnalytics[]>([]);
  const [loading, setLoading] = useState(useApiWriterContent);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!useApiWriterContent) return;

    let cancelled = false;

    setLoading(true);
    setLoadError("");

    apiWriterRepository
      .getBookAnalytics()
      .then((result) => {
        if (cancelled) return;
        setAnalytics(result.analytics ?? []);
      })
      .catch((caught) => {
        if (cancelled) return;

        setLoadError(
          caught instanceof Error
            ? caught.message
            : "Unable to load analytics.",
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

  const mockAnalytics = useMemo(() => writerRepository.getAnalytics(), []);

  const books = useMemo(() => {
    if (useApiWriterContent) {
      return analytics.map((item) => ({
        bookId: item.bookId,
        title: writerRepository.getBook(item.bookId)?.title ?? "Untitled book",
        views: item.views,
        readers: item.readers,
        unlocks: item.unlocks,
      }));
    }

    return mockAnalytics.map((item: WriterAnalytics) => ({
      bookId: item.bookId,
      title: writerRepository.getBook(item.bookId)?.title ?? "Untitled book",
      views: item.views,
      readers: item.uniqueReaders,
      unlocks: item.chapterReads,
    }));
  }, [analytics, mockAnalytics]);

  const totals = useMemo(
    () =>
      books.reduce(
        (summary, book) => ({
          views: summary.views + book.views,
          readers: summary.readers + book.readers,
          unlocks: summary.unlocks + book.unlocks,
        }),
        {
          views: 0,
          readers: 0,
          unlocks: 0,
        },
      ),
    [books],
  );

  const maxViews = Math.max(...books.map((book) => book.views), 1);

  return (
    <div className="somi-writer-page">
      <div className="somi-writer-inner">
        <header className="somi-writer-header">
          <div>
            <p className="somi-writer-eyebrow">Writer Studio</p>

            <h1 className="somi-writer-title">Analytics</h1>

            <p className="somi-writer-description">
              Understand how readers are discovering your books and where your
              published work is gaining traction.
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
              Analytics could not be loaded
            </p>

            <p className="somi-writer-notice-text">{loadError}</p>
          </div>
        )}

        <section className="somi-writer-section">
          <div className="somi-c5-kpi-grid">
            <article className="somi-c5-kpi">
              <div className="somi-c5-kpi-icon">
                <Eye size={17} />
              </div>

              <div>
                <p className="somi-c5-kpi-value">
                  {formatNumber(totals.views)}
                </p>

                <p className="somi-c5-kpi-label">Total views</p>
              </div>
            </article>

            <article className="somi-c5-kpi">
              <div className="somi-c5-kpi-icon">
                <Users size={17} />
              </div>

              <div>
                <p className="somi-c5-kpi-value">
                  {formatNumber(totals.readers)}
                </p>

                <p className="somi-c5-kpi-label">Unique readers</p>
              </div>
            </article>

            <article className="somi-c5-kpi">
              <div className="somi-c5-kpi-icon">
                <LockKeyhole size={17} />
              </div>

              <div>
                <p className="somi-c5-kpi-value">
                  {formatNumber(totals.unlocks)}
                </p>

                <p className="somi-c5-kpi-label">Chapter unlocks</p>
              </div>
            </article>

            <article className="somi-c5-kpi">
              <div className="somi-c5-kpi-icon">
                <BookOpen size={17} />
              </div>

              <div>
                <p className="somi-c5-kpi-value">
                  {formatNumber(books.length)}
                </p>

                <p className="somi-c5-kpi-label">Books tracked</p>
              </div>
            </article>
          </div>
        </section>

        <section className="somi-writer-section">
          <div className="somi-c5-section-heading">
            <div>
              <p className="somi-writer-eyebrow">Performance</p>

              <h2 className="somi-c5-section-title">Book performance</h2>
            </div>

            <span className="somi-c5-section-meta">
              {useApiWriterContent ? "Live platform data" : "Demo data"}
            </span>
          </div>

          {loading ? (
            <div className="somi-c5-empty">Loading analytics…</div>
          ) : books.length === 0 ? (
            <div className="somi-c5-empty">
              <BookOpen size={20} />
              <p>No analytics available yet.</p>
              <span>
                Once readers interact with your books, their performance will
                appear here.
              </span>
            </div>
          ) : (
            <div className="somi-c5-books">
              {books
                .slice()
                .sort((a, b) => b.views - a.views)
                .map((book, index) => {
                  const viewShare =
                    totals.views > 0 ? (book.views / totals.views) * 100 : 0;

                  const reachWidth = (book.views / maxViews) * 100;

                  return (
                    <article key={book.bookId} className="somi-c5-book-row">
                      <div className="somi-c5-book-rank">
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <div className="somi-c5-book-main">
                        <div className="somi-c5-book-heading">
                          <div>
                            <h3 className="somi-c5-book-title">{book.title}</h3>

                            <p className="somi-c5-book-subtitle">
                              {formatNumber(book.views)} views
                            </p>
                          </div>

                          <span className="somi-c5-book-share">
                            {formatPercent(viewShare)}
                          </span>
                        </div>

                        <div className="somi-c5-bar">
                          <div
                            className="somi-c5-bar-fill"
                            style={{
                              width: `${reachWidth}%`,
                            }}
                          />
                        </div>

                        <div className="somi-c5-book-stats">
                          <span>
                            <strong>{formatNumber(book.readers)}</strong>
                            readers
                          </span>

                          <span>
                            <strong>{formatNumber(book.unlocks)}</strong>
                            unlocks
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
            </div>
          )}
        </section>

        <section className="somi-writer-section">
          <div className="somi-c5-insight">
            <div>
              <p className="somi-writer-eyebrow">Reading the numbers</p>

              <h2 className="somi-c5-section-title">
                Use analytics to guide your next chapter.
              </h2>
            </div>

            <p>
              Views show reach, unique readers show audience size, and unlocks
              indicate how often readers continue into premium chapters. These
              figures are reported directly from the platform when API mode is
              enabled.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
