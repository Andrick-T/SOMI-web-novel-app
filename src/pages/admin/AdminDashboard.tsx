import {
  AlertTriangle,
  BookOpen,
  Coins,
  ShieldAlert,
  TrendingUp,
  Users,
} from "lucide-react";
import { mockAdminRepository } from "../../features/admin";
import type { CommonProps } from "../../types";

export default function AdminDashboard({ navigate }: CommonProps) {
  const summary = mockAdminRepository.getDashboardSummary();
  const attentionItems = summary.needsAttention;

  const kpis = [
    {
      label: "Active readers",
      value: summary.activeReaders.toLocaleString(),
      icon: <Users size={16} color="var(--color-accent-primary)" />,
    },
    {
      label: "Active writers",
      value: summary.activeWriters.toString(),
      icon: <BookOpen size={16} color="var(--color-accent-primary)" />,
    },
    {
      label: "Published books",
      value: summary.publishedBooks.toLocaleString(),
      icon: <BookOpen size={16} color="var(--color-status-info)" />,
    },
    {
      label: "Pending moderation",
      value: summary.pendingModeration.toString(),
      icon: <ShieldAlert size={16} color="var(--color-status-warning)" />,
    },
    {
      label: "Transactions today",
      value: summary.transactionsToday.toString(),
      icon: <Coins size={16} color="var(--color-status-warning)" />,
    },
    {
      label: "Revenue today",
      value: `$${summary.revenueToday.toLocaleString()}`,
      icon: <TrendingUp size={16} color="var(--color-status-success)" />,
    },
  ];

  return (
    <div className="flex min-h-full flex-col bg-[var(--color-background)] px-5 py-8 text-[var(--color-text-primary)]">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
          Admin Console
        </p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">
          Admin Overview
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Monitor the health of SOMI and resolve platform issues.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => navigate("admin-content")}
          className="somi-control rounded-lg bg-[rgba(96,165,250,0.12)] px-3 py-2 text-xs font-semibold text-[var(--color-accent-primary)]"
        >
          Review moderation
        </button>
        <button
          type="button"
          onClick={() => navigate("admin-reports")}
          className="somi-control rounded-lg bg-[rgba(96,165,250,0.12)] px-3 py-2 text-xs font-semibold text-[var(--color-accent-primary)]"
        >
          View reports
        </button>
        <button
          type="button"
          onClick={() => navigate("admin-economy")}
          className="somi-control rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)]"
        >
          Review economy
        </button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4"
          >
            <div className="flex items-center justify-between">
              {kpi.icon}
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-accent-primary)]">
                Live
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">
              {kpi.value}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              {kpi.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
        <section className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Needs attention
            </h2>
            <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent-primary)]">
              Operational queue
            </span>
          </div>
          <div className="space-y-2">
            {attentionItems.length === 0 ? (
              <div className="rounded-xl bg-[var(--color-background)] px-3 py-3 text-sm text-[var(--color-text-secondary)]">
                No immediate operational issues detected.
              </div>
            ) : (
              attentionItems.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => navigate(item.path as any)}
                  className="flex w-full items-center justify-between rounded-xl bg-[var(--color-background)] px-3 py-2.5 text-left transition-colors hover:bg-[var(--color-hover-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {item.label}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Action required
                    </p>
                  </div>
                  <span className="rounded-full bg-[rgba(251,113,133,0.18)] px-2 py-1 text-xs font-bold text-[var(--color-status-danger)]">
                    {item.count}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Platform activity
            </h2>
          </div>
          <div className="space-y-3">
            {summary.activity.map((entry) => (
              <div
                key={entry.id}
                className="flex gap-2 rounded-xl bg-[var(--color-background)] p-3"
              >
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-accent-primary)]" />
                <div className="flex-1">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {entry.text}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                    {entry.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
            Content health
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              [
                "Books published this week",
                summary.contentHealth.booksPublishedThisWeek,
              ],
              [
                "Chapters published this week",
                summary.contentHealth.chaptersPublishedThisWeek,
              ],
              ["Pending submissions", summary.contentHealth.pendingSubmissions],
              ["Rejected content", summary.contentHealth.rejectedContent],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl bg-[var(--color-background)] p-3"
              >
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  {label}
                </p>
                <p className="mt-2 text-xl font-bold text-[var(--color-text-primary)]">
                  {String(value)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
            Economy health
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ["Coins purchased", summary.economyHealth.coinsPurchased],
              ["Coins spent", summary.economyHealth.coinsSpent],
              ["Revenue", `$${summary.economyHealth.revenue.toLocaleString()}`],
              ["Refunds", summary.economyHealth.refunds],
              ["Failed transactions", summary.economyHealth.failedTransactions],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl bg-[var(--color-background)] p-3"
              >
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  {label}
                </p>
                <p className="mt-2 text-xl font-bold text-[var(--color-text-primary)]">
                  {String(value)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
