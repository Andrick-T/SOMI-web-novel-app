import {
  ArrowRight,
  BookOpen,
  Coins,
  FileWarning,
  ShieldAlert,
  TrendingUp,
  Users,
} from "lucide-react";
import { mockAdminRepository } from "../../features/admin";
import type { CommonProps } from "../../types";

export default function AdminDashboard({ navigate }: CommonProps) {
  const summary = mockAdminRepository.getDashboardSummary();

  const kpis = [
    {
      label: "Active readers",
      value: summary.activeReaders.toLocaleString(),
      icon: Users,
      tone: "default",
    },
    {
      label: "Active writers",
      value: summary.activeWriters.toLocaleString(),
      icon: BookOpen,
      tone: "default",
    },
    {
      label: "Published books",
      value: summary.publishedBooks.toLocaleString(),
      icon: BookOpen,
      tone: "info",
    },
    {
      label: "Pending moderation",
      value: summary.pendingModeration.toLocaleString(),
      icon: ShieldAlert,
      tone: "warning",
    },
    {
      label: "Transactions today",
      value: summary.transactionsToday.toLocaleString(),
      icon: Coins,
      tone: "warning",
    },
    {
      label: "Revenue today",
      value: `$${summary.revenueToday.toLocaleString()}`,
      icon: TrendingUp,
      tone: "success",
    },
  ];

  const contentHealth = [
    {
      label: "Books published this week",
      value: summary.contentHealth.booksPublishedThisWeek,
    },
    {
      label: "Chapters published this week",
      value: summary.contentHealth.chaptersPublishedThisWeek,
    },
    {
      label: "Pending submissions",
      value: summary.contentHealth.pendingSubmissions,
    },
    {
      label: "Rejected content",
      value: summary.contentHealth.rejectedContent,
    },
  ];

  const economyHealth = [
    {
      label: "Coins purchased",
      value: summary.economyHealth.coinsPurchased.toLocaleString(),
    },
    {
      label: "Coins spent",
      value: summary.economyHealth.coinsSpent.toLocaleString(),
    },
    {
      label: "Revenue",
      value: `$${summary.economyHealth.revenue.toLocaleString()}`,
    },
    {
      label: "Refunds",
      value: summary.economyHealth.refunds.toLocaleString(),
    },
    {
      label: "Failed transactions",
      value: summary.economyHealth.failedTransactions.toLocaleString(),
    },
  ];

  return (
    <main className="somi-admin-page">
      <div className="somi-admin-inner">
        {/* Header */}
        <header className="somi-admin-header">
          <div>
            <p className="somi-admin-eyebrow">Admin Console</p>

            <h1 className="somi-admin-title">Platform overview</h1>

            <p className="somi-admin-description">
              Monitor SOMI activity, content moderation, users, and the platform
              economy.
            </p>
          </div>

          <div className="somi-admin-header-actions">
            <button
              type="button"
              onClick={() => navigate("admin-content")}
              className="somi-admin-button somi-admin-button-primary"
            >
              Review moderation
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              onClick={() => navigate("admin-reports")}
              className="somi-admin-button somi-admin-button-secondary"
            >
              Reports
            </button>
          </div>
        </header>

        {/* KPI strip */}
        <section className="somi-admin-kpi-grid" aria-label="Platform metrics">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;

            return (
              <div
                key={kpi.label}
                className={`somi-admin-kpi somi-admin-kpi-${kpi.tone}`}
              >
                <div className="somi-admin-kpi-top">
                  <span className="somi-admin-kpi-icon">
                    <Icon size={16} />
                  </span>

                  <span className="somi-admin-kpi-status">Current</span>
                </div>

                <p className="somi-admin-kpi-value">{kpi.value}</p>

                <p className="somi-admin-kpi-label">{kpi.label}</p>
              </div>
            );
          })}
        </section>

        {/* Main operational area */}
        <section className="somi-admin-dashboard-grid">
          {/* Needs attention */}
          <section className="somi-admin-section somi-admin-attention">
            <div className="somi-admin-section-heading">
              <div>
                <p className="somi-admin-section-eyebrow">Operational queue</p>

                <h2 className="somi-admin-section-title">Needs attention</h2>
              </div>

              <span className="somi-admin-section-count">
                {summary.needsAttention.length}
              </span>
            </div>

            <div className="somi-admin-attention-list">
              {summary.needsAttention.length === 0 ? (
                <div className="somi-admin-empty">
                  <p>No immediate operational issues detected.</p>
                </div>
              ) : (
                summary.needsAttention.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.path as any)}
                    className="somi-admin-attention-item"
                  >
                    <span
                      className={`somi-admin-attention-marker severity-${item.severity.toLowerCase()}`}
                    />

                    <span className="somi-admin-attention-copy">
                      <strong>{item.label}</strong>
                      <small>Action required</small>
                    </span>

                    <span className="somi-admin-attention-count">
                      {item.count}
                    </span>

                    <ArrowRight
                      size={14}
                      className="somi-admin-attention-arrow"
                    />
                  </button>
                ))
              )}
            </div>
          </section>

          {/* Activity */}
          <section className="somi-admin-section">
            <div className="somi-admin-section-heading">
              <div>
                <p className="somi-admin-section-eyebrow">Recent events</p>

                <h2 className="somi-admin-section-title">Platform activity</h2>
              </div>
            </div>

            <div className="somi-admin-activity-list">
              {summary.activity.map((entry) => (
                <div key={entry.id} className="somi-admin-activity-item">
                  <span
                    className={`somi-admin-activity-dot activity-${entry.type}`}
                  />

                  <div className="somi-admin-activity-copy">
                    <p>{entry.text}</p>

                    <span>{entry.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>

        {/* Health overview */}
        <section className="somi-admin-health-grid">
          <section className="somi-admin-section">
            <div className="somi-admin-section-heading">
              <div>
                <p className="somi-admin-section-eyebrow">Publishing</p>

                <h2 className="somi-admin-section-title">Content health</h2>
              </div>

              <button
                type="button"
                onClick={() => navigate("admin-content")}
                className="somi-admin-inline-link"
              >
                Manage content
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="somi-admin-health-list">
              {contentHealth.map((item) => (
                <div key={item.label} className="somi-admin-health-row">
                  <span>{item.label}</span>
                  <strong>{item.value.toLocaleString()}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="somi-admin-section">
            <div className="somi-admin-section-heading">
              <div>
                <p className="somi-admin-section-eyebrow">Transactions</p>

                <h2 className="somi-admin-section-title">Economy health</h2>
              </div>

              <button
                type="button"
                onClick={() => navigate("admin-economy")}
                className="somi-admin-inline-link"
              >
                Open economy
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="somi-admin-health-list">
              {economyHealth.map((item) => (
                <div key={item.label} className="somi-admin-health-row">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </section>
        </section>

        {/* Bottom shortcuts */}
        <section className="somi-admin-dashboard-footer">
          <div>
            <p className="somi-admin-section-eyebrow">Administration</p>

            <h2 className="somi-admin-section-title">Quick access</h2>
          </div>

          <div className="somi-admin-quick-links">
            <button
              type="button"
              onClick={() => navigate("admin-users")}
              className="somi-admin-quick-link"
            >
              <Users size={16} />
              Users & writers
              <ArrowRight size={13} />
            </button>

            <button
              type="button"
              onClick={() => navigate("admin-reports")}
              className="somi-admin-quick-link"
            >
              <FileWarning size={16} />
              Reports
              <ArrowRight size={13} />
            </button>

            <button
              type="button"
              onClick={() => navigate("admin-transactions")}
              className="somi-admin-quick-link"
            >
              <Coins size={16} />
              Transactions
              <ArrowRight size={13} />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
