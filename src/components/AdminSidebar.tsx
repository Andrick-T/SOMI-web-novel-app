import {
  ArrowLeft,
  BadgeAlert,
  BookOpen,
  Coins,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { Page } from "../types";

interface Props {
  page: Page;
  navigate: (page: Page) => void;
  setEnvironment: (env: "reader" | "writer" | "admin") => void;
}

const links: {
  page: Page;
  label: string;
  icon: React.ElementType;
  badge?: number;
}[] = [
  { page: "admin-dashboard", label: "Overview", icon: LayoutDashboard },
  { page: "admin-users", label: "Users", icon: UserRound },
  { page: "admin-writers", label: "Writers", icon: BookOpen },
  { page: "admin-content", label: "Content", icon: BookOpen, badge: 12 },
  { page: "admin-reports", label: "Reports", icon: BadgeAlert, badge: 4 },
  { page: "admin-economy", label: "Economy", icon: Coins },
  { page: "admin-transactions", label: "Transactions", icon: FileText },
  { page: "admin-audit", label: "Audit Log", icon: FileText },
  { page: "admin-settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar({
  page,
  navigate,
  setEnvironment,
}: Props) {
  return (
    <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-background)] px-3 py-6 md:flex">
      <button
        type="button"
        onClick={() => {
          setEnvironment("reader");
          navigate("home");
        }}
        className="mb-6 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)] transition-all hover:opacity-80"
      >
        <ArrowLeft size={13} />
        Reader App
      </button>

      <div className="mb-4 px-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
          Operations
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {links.map((item) => {
          const active = page === item.page;
          const Icon = item.icon;
          return (
            <button
              key={item.page}
              type="button"
              onClick={() => navigate(item.page)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all hover:bg-[var(--color-hover-surface)]"
              style={{
                background: active
                  ? "var(--color-active-surface)"
                  : "transparent",
                color: active
                  ? "var(--color-accent-primary)"
                  : "var(--color-text-muted)",
              }}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
              <span className="flex-1">{item.label}</span>
              {typeof item.badge === "number" && item.badge > 0 && (
                <span className="flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(251,113,133,0.18)] px-1 text-[9px] font-bold text-[var(--color-status-danger)]">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-4 rounded-xl border border-[rgba(251,113,133,0.2)] bg-[rgba(251,113,133,0.07)] p-3">
        <div className="mb-1 flex items-center gap-2">
          <ShieldCheck size={13} color="var(--color-status-danger)" />
          <span className="text-xs font-bold text-[var(--color-status-danger)]">
            4 reports
          </span>
        </div>
        <p className="text-[10px] text-[var(--color-text-muted)]">
          Flagged content and user reports need review.
        </p>
        <button
          type="button"
          onClick={() => navigate("admin-reports")}
          className="mt-2 text-[10px] font-semibold text-[var(--color-status-danger)]"
        >
          Review queue →
        </button>
      </div>
    </aside>
  );
}
