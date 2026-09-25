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
  {
    page: "admin-dashboard",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    page: "admin-users",
    label: "Users",
    icon: UserRound,
  },
  {
    page: "admin-writers",
    label: "Writers",
    icon: BookOpen,
  },
  {
    page: "admin-content",
    label: "Content",
    icon: BookOpen,
    badge: 12,
  },
  {
    page: "admin-reports",
    label: "Reports",
    icon: BadgeAlert,
    badge: 4,
  },
  {
    page: "admin-economy",
    label: "Economy",
    icon: Coins,
  },
  {
    page: "admin-transactions",
    label: "Transactions",
    icon: FileText,
  },
  {
    page: "admin-withdrawals",
    label: "Withdrawals",
    icon: Coins,
  },
  {
    page: "admin-support",
    label: "Payment Support",
    icon: BadgeAlert,
  },
  {
    page: "admin-audit",
    label: "Audit Log",
    icon: FileText,
  },
  {
    page: "admin-settings",
    label: "Settings",
    icon: Settings,
  },
];

export default function AdminSidebar({
  page,
  navigate,
  setEnvironment,
}: Props) {
  return (
    <aside className="somi-admin-sidebar hidden md:flex md:flex-col">
      <button
        type="button"
        onClick={() => {
          setEnvironment("reader");
          navigate("home");
        }}
        className="somi-admin-sidebar-back"
      >
        <ArrowLeft size={13} />
        <span>Reader App</span>
      </button>

      <p className="somi-admin-sidebar-label">Operations</p>

      <nav className="somi-admin-sidebar-nav">
        {links.map((item) => {
          const active = page === item.page;
          const Icon = item.icon;

          return (
            <button
              key={item.page}
              type="button"
              onClick={() => navigate(item.page)}
              className={`somi-admin-sidebar-link${
                active ? " somi-admin-sidebar-link-active" : ""
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2.3 : 1.8} />

              <span>{item.label}</span>

              {typeof item.badge === "number" && item.badge > 0 && (
                <span className="somi-admin-sidebar-badge">{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="somi-admin-sidebar-alert">
        <div className="somi-admin-sidebar-alert-title">
          <ShieldCheck size={13} />
          <span>4 reports</span>
        </div>

        <p className="somi-admin-sidebar-alert-text">
          Flagged content and user reports need review.
        </p>

        <button
          type="button"
          onClick={() => navigate("admin-reports")}
          className="somi-admin-sidebar-alert-action"
        >
          Review queue →
        </button>
      </div>
    </aside>
  );
}
