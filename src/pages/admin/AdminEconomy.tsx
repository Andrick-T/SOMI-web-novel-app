import { useMemo } from "react";
import {
  ArrowRight,
  CircleAlert,
  Coins,
  CreditCard,
  RotateCcw,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { mockAdminRepository } from "../../features/admin/repository";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function transactionLabel(type: string) {
  switch (type) {
    case "COIN_PURCHASE":
      return "Coin purchase";
    case "CHAPTER_UNLOCK":
      return "Chapter unlock";
    case "REFUND":
      return "Refund";
    case "ADJUSTMENT":
      return "Adjustment";
    default:
      return type.split("_").join(" ");
  }
}

function statusClass(status: string) {
  switch (status) {
    case "COMPLETED":
      return "somi-admin-status somi-admin-status-success";
    case "PENDING":
      return "somi-admin-status somi-admin-status-warning";
    case "FAILED":
      return "somi-admin-status somi-admin-status-danger";
    case "REFUNDED":
      return "somi-admin-status somi-admin-status-info";
    case "CANCELLED":
      return "somi-admin-status somi-admin-status-muted";
    default:
      return "somi-admin-status";
  }
}

export default function AdminEconomy() {
  const navigate = useNavigate();

  const summary = useMemo(() => mockAdminRepository.getEconomySummary(), []);

  const transactions = useMemo(() => mockAdminRepository.getTransactions(), []);

  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        .slice(0, 5),
    [transactions],
  );

  const metrics = [
    {
      label: "Coins purchased",
      value: formatNumber(summary.totalCoinPurchases),
      icon: Coins,
      tone: "accent",
    },
    {
      label: "Coins spent",
      value: formatNumber(summary.totalCoinsSpent),
      icon: Wallet,
      tone: "info",
    },
    {
      label: "Revenue",
      value: formatAmount(summary.revenue),
      icon: CreditCard,
      tone: "success",
      suffix: "demo units",
    },
    {
      label: "Refunds",
      value: formatAmount(summary.refunds),
      icon: RotateCcw,
      tone: "warning",
      suffix: "demo units",
    },
    {
      label: "Failed payments",
      value: formatNumber(summary.failedPayments),
      icon: CircleAlert,
      tone: "danger",
    },
    {
      label: "Pending transactions",
      value: formatNumber(summary.pendingTransactions),
      icon: CircleAlert,
      tone: "warning",
    },
  ];

  return (
    <div className="somi-admin-page">
      <div className="somi-admin-inner">
        <header className="somi-admin-header">
          <div>
            <p className="somi-admin-eyebrow">Economy</p>
            <h1 className="somi-admin-title">Platform economy</h1>
            <p className="somi-admin-description">
              Monitor coin movement, payment activity and the current
              transaction state across the platform.
            </p>
          </div>

          <button
            type="button"
            className="somi-admin-secondary-action"
            onClick={() => navigate("/admin/economy/transactions")}
          >
            View transactions
            <ArrowRight size={16} />
          </button>
        </header>

        <section className="somi-admin-notice somi-admin-notice-info">
          <CircleAlert size={17} />
          <div>
            <strong>Repository demo data</strong>
            <span>
              The figures currently displayed come from the admin mock
              repository. They are useful for validating the administration
              interface but should not be interpreted as live SOMI financial
              reporting.
            </span>
          </div>
        </section>

        <section className="somi-admin-section">
          <div className="somi-admin-section-heading">
            <div>
              <h2>Economy overview</h2>
              <p>Current values exposed by the administration repository.</p>
            </div>
          </div>

          <div className="somi-admin-kpi-grid somi-admin-kpi-grid-six">
            {metrics.map((metric) => {
              const Icon = metric.icon;

              return (
                <article
                  key={metric.label}
                  className={`somi-admin-kpi somi-admin-kpi-${metric.tone}`}
                >
                  <div className="somi-admin-kpi-icon">
                    <Icon size={17} />
                  </div>

                  <div className="somi-admin-kpi-content">
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                    {metric.suffix && <small>{metric.suffix}</small>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="somi-admin-section somi-admin-economy-layout">
          <div className="somi-admin-surface">
            <div className="somi-admin-surface-header">
              <div>
                <h2>Recent economy activity</h2>
                <p>Latest transactions currently available.</p>
              </div>

              <button
                type="button"
                className="somi-admin-inline-action"
                onClick={() => navigate("/admin/economy/transactions")}
              >
                Open history
                <ArrowRight size={15} />
              </button>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="somi-admin-empty">
                <p>No transactions available.</p>
              </div>
            ) : (
              <div className="somi-admin-activity-list">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="somi-admin-activity-row">
                    <div className="somi-admin-activity-main">
                      <strong>{transactionLabel(transaction.type)}</strong>
                      <span>
                        {transaction.user} · {formatDate(transaction.timestamp)}
                      </span>
                    </div>

                    <div className="somi-admin-activity-value">
                      <strong>{formatNumber(transaction.coins)} coins</strong>
                      <span className={statusClass(transaction.status)}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="somi-admin-surface somi-admin-economy-note">
            <div className="somi-admin-surface-header">
              <div>
                <h2>Operational focus</h2>
                <p>What this area should help administrators monitor.</p>
              </div>
            </div>

            <div className="somi-admin-check-list">
              <div>
                <span>01</span>
                <p>Track incoming coin purchases.</p>
              </div>
              <div>
                <span>02</span>
                <p>Monitor coin consumption through chapter unlocks.</p>
              </div>
              <div>
                <span>03</span>
                <p>Identify failed or pending payment activity.</p>
              </div>
              <div>
                <span>04</span>
                <p>Review refunds and manual adjustments.</p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
