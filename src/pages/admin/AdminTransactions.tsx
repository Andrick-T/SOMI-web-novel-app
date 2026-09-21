import { useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { mockAdminRepository } from "../../features/admin/repository";
import type {
  AdminTransaction,
  TransactionStatus,
  TransactionType,
} from "../../features/admin/types";

const ALL = "ALL";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatAmount(value: number, currency: string) {
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)} ${currency}`;
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

function transactionTypeLabel(type: TransactionType) {
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
      return type;
  }
}

function statusClass(status: TransactionStatus) {
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

export default function AdminTransactions() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [type, setType] = useState<TransactionType | typeof ALL>(ALL);
  const [status, setStatus] = useState<TransactionStatus | typeof ALL>(ALL);

  const transactions = useMemo(() => mockAdminRepository.getTransactions(), []);

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return transactions
      .filter((transaction) => {
        if (type !== ALL && transaction.type !== type) {
          return false;
        }

        if (status !== ALL && transaction.status !== status) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return [
          transaction.id,
          transaction.user,
          transaction.userId,
          transaction.type,
          transaction.status,
          transaction.currency,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  }, [query, status, transactions, type]);

  const counts = useMemo(
    () => ({
      total: transactions.length,
      pending: transactions.filter((item) => item.status === "PENDING").length,
      completed: transactions.filter((item) => item.status === "COMPLETED")
        .length,
      failed: transactions.filter((item) => item.status === "FAILED").length,
    }),
    [transactions],
  );

  return (
    <div className="somi-admin-page">
      <div className="somi-admin-inner">
        <header className="somi-admin-header">
          <div>
            <p className="somi-admin-eyebrow">Economy / Transactions</p>
            <h1 className="somi-admin-title">Transaction history</h1>
            <p className="somi-admin-description">
              Review platform transaction activity and quickly identify pending,
              failed or completed operations.
            </p>
          </div>

          <button
            type="button"
            className="somi-admin-secondary-action"
            onClick={() => navigate("/admin/economy")}
          >
            Economy overview
            <ArrowRight size={16} />
          </button>
        </header>

        <section className="somi-admin-notice somi-admin-notice-info">
          <SlidersHorizontal size={17} />
          <div>
            <strong>Demo transaction directory</strong>
            <span>
              This directory currently reads from the mock administration
              repository. No payment operation is executed from this page.
            </span>
          </div>
        </section>

        <section className="somi-admin-section">
          <div className="somi-admin-mini-summary">
            <div>
              <span>Total</span>
              <strong>{counts.total}</strong>
            </div>
            <div>
              <span>Completed</span>
              <strong>{counts.completed}</strong>
            </div>
            <div>
              <span>Pending</span>
              <strong>{counts.pending}</strong>
            </div>
            <div>
              <span>Failed</span>
              <strong>{counts.failed}</strong>
            </div>
          </div>
        </section>

        <section className="somi-admin-section">
          <div className="somi-admin-toolbar">
            <label className="somi-admin-search">
              <Search size={17} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search transaction, user or ID"
                aria-label="Search transactions"
              />
            </label>

            <label className="somi-admin-select">
              <span>Type</span>
              <select
                value={type}
                onChange={(event) =>
                  setType(event.target.value as TransactionType | typeof ALL)
                }
              >
                <option value={ALL}>All types</option>
                <option value="COIN_PURCHASE">Coin purchase</option>
                <option value="CHAPTER_UNLOCK">Chapter unlock</option>
                <option value="REFUND">Refund</option>
                <option value="ADJUSTMENT">Adjustment</option>
              </select>
              <ChevronDown size={15} />
            </label>

            <label className="somi-admin-select">
              <span>Status</span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as TransactionStatus | typeof ALL,
                  )
                }
              >
                <option value={ALL}>All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <ChevronDown size={15} />
            </label>
          </div>

          <div className="somi-admin-table-wrap">
            <table className="somi-admin-table">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Coins</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {filteredTransactions.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                  />
                ))}
              </tbody>
            </table>

            {filteredTransactions.length === 0 && (
              <div className="somi-admin-empty">
                <Search size={20} />
                <strong>No transactions found</strong>
                <p>Try changing the search query or transaction filters.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function TransactionRow({ transaction }: { transaction: AdminTransaction }) {
  return (
    <tr>
      <td>
        <div className="somi-admin-table-primary">
          <strong>{transaction.id}</strong>
          <span>Transaction reference</span>
        </div>
      </td>

      <td>
        <div className="somi-admin-table-primary">
          <strong>{transaction.user}</strong>
          <span>{transaction.userId}</span>
        </div>
      </td>

      <td>
        <span className="somi-admin-type-label">
          {transactionTypeLabel(transaction.type)}
        </span>
      </td>

      <td>
        <strong className="somi-admin-number">
          {formatAmount(transaction.amount, transaction.currency)}
        </strong>
      </td>

      <td>
        <span className="somi-admin-coins">
          {formatNumber(transaction.coins)}
        </span>
      </td>

      <td>
        <span className={statusClass(transaction.status)}>
          {transaction.status}
        </span>
      </td>

      <td>
        <span className="somi-admin-date">
          {formatDate(transaction.timestamp)}
        </span>
      </td>
    </tr>
  );
}
