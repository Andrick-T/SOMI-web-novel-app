import { useEffect, useState } from "react";
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

export default function WriterEarnings({}: CommonProps) {
  const mockEarnings = writerRepository.getEarnings();
  const [earnings, setEarnings] = useState({
    grossEarnings: mockEarnings.grossEarnings,
    pending: mockEarnings.pending,
    available: mockEarnings.available,
    netEarnings: mockEarnings.netEarnings,
  });
  const [transactions, setTransactions] = useState(() => [
    { label: "The Baobab Kingdom", amount: 620, type: "Chapter unlocks" },
    { label: "Echoes of Kongo", amount: 470, type: "Series release" },
    { label: "Grandmother's Fire", amount: 310, type: "Reader milestone" },
  ]);
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
            label: transaction.chapterId,
            amount: transaction.coins,
            type: transaction.status,
          })),
        );
      })
      .catch((caught) =>
        setLoadError(
          caught instanceof Error ? caught.message : "Unable to load earnings.",
        ),
      );
  }, []);

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
          <MiniBarChart
            values={[32, 46, 42, 73, 58, 80, 92]}
            labels={["M", "T", "W", "T", "F", "S", "S"]}
            color="#4ade80"
            labelColor="#4a6540"
            height={64}
          />
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
              key={item.label}
              className="rounded-xl p-4 flex items-center justify-between"
              style={{ background: "#1e2118", border: "1px solid #2a3525" }}
            >
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "#f0ece4" }}
                >
                  {item.label}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "#6a8060" }}>
                  {item.type}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-bold"
                  style={{ color: "#4ade80" }}
                >
                  $ {item.amount.toLocaleString()}
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
