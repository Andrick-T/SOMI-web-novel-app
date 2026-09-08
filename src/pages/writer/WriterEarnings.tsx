import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CircleDollarSign,
  TrendingUp,
  Wallet,
  ReceiptText,
} from "lucide-react";
import type { CommonProps } from "../../types";
import { writerRepository } from "../../features/writer";
import {
  apiWriterRepository,
  useApiWriterContent,
} from "../../services/repositories/writerRepository";
import MiniBarChart from "../../components/MiniBarChart";

type EarningTransaction = {
  id: string;
  bookId: string;
  chapterId: string;
  sourceTransactionId: string;
  coins: number;
  status: string;
  createdAt: string;
};

export default function WriterEarnings({}: CommonProps) {
  const mockEarnings = writerRepository.getEarnings();

  const [earnings, setEarnings] = useState({
    grossEarnings: useApiWriterContent ? 0 : mockEarnings.grossEarnings,
    pending: useApiWriterContent ? 0 : mockEarnings.pending,
    available: useApiWriterContent ? 0 : mockEarnings.available,
    netEarnings: useApiWriterContent ? 0 : mockEarnings.netEarnings,
  });

  const [transactions, setTransactions] = useState<EarningTransaction[]>(
    useApiWriterContent
      ? []
      : [
          {
            id: "mock-1",
            bookId: "mock-book-1",
            chapterId: "mock-chapter-1",
            sourceTransactionId: "mock-transaction-1",
            coins: 620,
            status: "COMPLETED",
            createdAt: new Date().toISOString(),
          },
          {
            id: "mock-2",
            bookId: "mock-book-2",
            chapterId: "mock-chapter-2",
            sourceTransactionId: "mock-transaction-2",
            coins: 470,
            status: "COMPLETED",
            createdAt: new Date().toISOString(),
          },
          {
            id: "mock-3",
            bookId: "mock-book-3",
            chapterId: "mock-chapter-3",
            sourceTransactionId: "mock-transaction-3",
            coins: 310,
            status: "COMPLETED",
            createdAt: new Date().toISOString(),
          },
        ],
  );

  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!useApiWriterContent) return;

    Promise.all([
      apiWriterRepository.getEarnings(),
      apiWriterRepository.getEarningTransactions(),
    ])
      .then(([summary, result]) => {
        setEarnings({
          grossEarnings: summary.totalCoins,
          pending: summary.pendingCoins,
          available: summary.availableCoins,
          netEarnings: summary.availableCoins,
        });

        setTransactions(
          result.transactions.map((transaction) => ({
            ...transaction,
            sourceTransactionId: transaction.id,
          })),
        );
      })
      .catch((caught) => {
        setLoadError(
          caught instanceof Error ? caught.message : "Unable to load earnings.",
        );
      });
  }, []);

  const revenueTrend = useMemo(() => {
    const now = new Date();

    const days = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(now);
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - (6 - index));
      return day;
    });

    return days.map((day) => {
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const total = transactions
        .filter((transaction) => {
          const createdAt = new Date(transaction.createdAt);

          return createdAt >= day && createdAt < nextDay;
        })
        .reduce((sum, transaction) => sum + transaction.coins, 0);

      return {
        value: total,
        label: day
          .toLocaleDateString(undefined, { weekday: "short" })
          .slice(0, 1),
      };
    });
  }, [transactions]);

  const hasRevenueActivity = revenueTrend.some((day) => day.value > 0);

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
          Earnings
        </h1>
      </div>

      {loadError && (
        <p className="px-5 pb-4 text-sm" style={{ color: "#fb7185" }}>
          {loadError}
        </p>
      )}

      <div className="px-5 mb-5 grid grid-cols-2 gap-3">
        {[
          {
            label: "Gross",
            value: `${earnings.grossEarnings.toLocaleString()} coins`,
            icon: <CircleDollarSign size={16} color="#4ade80" />,
          },
          {
            label: "Pending",
            value: `${earnings.pending.toLocaleString()} coins`,
            icon: <ReceiptText size={16} color="#e8a84c" />,
          },
          {
            label: "Available",
            value: `${earnings.available.toLocaleString()} coins`,
            icon: <Wallet size={16} color="#60a5fa" />,
          },
          {
            label: "Net",
            value: `${earnings.netEarnings.toLocaleString()} coins`,
            icon: <TrendingUp size={16} color="#fb7185" />,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="somi-surface rounded-xl p-4"
            style={{ background: "var(--color-surface)" }}
          >
            <div className="flex items-center justify-between mb-2">
              {item.icon}

              <span
                className="text-[9px] uppercase tracking-wider"
                style={{ color: "#4a6540" }}
              >
                {item.label}
              </span>
            </div>

            <p
              className="font-display text-2xl font-bold"
              style={{ color: "#f0ece4" }}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="px-5 mb-5">
        <div
          className="rounded-xl p-4"
          style={{ background: "#1e2118", border: "1px solid #2a3525" }}
        >
          <p
            className="text-[10px] uppercase tracking-wider mb-3"
            style={{ color: "#4a6540" }}
          >
            Revenue trend
          </p>

          {hasRevenueActivity ? (
            <MiniBarChart
              values={revenueTrend.map((day) => day.value)}
              labels={revenueTrend.map((day) => day.label)}
              color="#4ade80"
              labelColor="#4a6540"
              height={64}
            />
          ) : (
            <div
              className="h-16 flex items-center justify-center text-xs"
              style={{ color: "#6a8060" }}
            >
              No earnings activity in the last 7 days.
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-8">
        <h3
          className="font-display text-base font-semibold mb-3"
          style={{ color: "#f0ece4" }}
        >
          Recent payouts
        </h3>

        <div className="flex flex-col gap-3">
          {transactions.length === 0 && (
            <p className="text-sm" style={{ color: "#6a8060" }}>
              No earnings transactions yet.
            </p>
          )}

          {transactions.map((item) => (
            <div
              key={item.id}
              className="rounded-xl p-4 flex items-center justify-between"
              style={{ background: "#1e2118", border: "1px solid #2a3525" }}
            >
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "#f0ece4" }}
                >
                  Chapter {item.chapterId}
                </p>

                <p className="text-[10px] mt-0.5" style={{ color: "#6a8060" }}>
                  {item.status}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-bold"
                  style={{ color: "#4ade80" }}
                >
                  {item.coins.toLocaleString()} coins
                </span>

                <ArrowUpRight size={14} color="#4ade80" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
