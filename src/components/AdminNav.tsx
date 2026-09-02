import {
  LayoutDashboard,
  Users,
  BookOpen,
  Coins,
  Settings,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import { useState } from "react";
import type { Page } from "../types";
import { navigation } from "../config/designSystem";

interface AdminNavProps {
  page: Page;
  navigate: (page: Page) => void;
}

const icons: Record<string, React.ElementType> = {
  "admin-dashboard": LayoutDashboard,
  "admin-users": Users,
  "admin-writers": BookOpen,
  "admin-content": BookOpen,
  "admin-reports": FileText,
  "admin-economy": Coins,
  "admin-transactions": FileText,
  "admin-audit": FileText,
  "admin-settings": Settings,
};

export default function AdminNav({ page, navigate }: AdminNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const primaryItems = navigation.admin.slice(0, 5);
  const secondaryItems = navigation.admin.slice(5);

  return (
    <nav className="relative border-t border-[var(--color-border-subtle)] bg-[var(--color-background)]">
      <div className="flex items-center justify-around px-1 pb-5 pt-2.5">
        {[...primaryItems, { page: "admin-more" as Page, label: "More" }].map(
          (item) => {
            const active = page === item.page;
            const Icon = icons[item.page];
            const isMore = item.page === "admin-more";
            return (
              <button
                key={item.page}
                type="button"
                onClick={() =>
                  isMore ? setMoreOpen((value) => !value) : navigate(item.page)
                }
                className="flex min-w-[52px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition-all active:scale-90 hover:bg-[var(--color-hover-surface)]"
              >
                {isMore ? (
                  <MoreHorizontal
                    size={20}
                    strokeWidth={moreOpen ? 2.5 : 1.8}
                    color={
                      moreOpen
                        ? "var(--color-accent-primary)"
                        : "var(--color-text-muted)"
                    }
                  />
                ) : (
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.5 : 1.8}
                    color={
                      active
                        ? "var(--color-accent-primary)"
                        : "var(--color-text-muted)"
                    }
                  />
                )}
                <span
                  className="text-[9px] font-bold"
                  style={{
                    color:
                      active || (isMore && moreOpen)
                        ? "var(--color-accent-primary)"
                        : "var(--color-text-muted)",
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          },
        )}
      </div>

      {moreOpen && (
        <div className="absolute bottom-[4.5rem] right-2 flex min-w-40 flex-col gap-1 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-2 shadow-2xl">
          {secondaryItems.map((item) => {
            const Icon = icons[item.page];
            return (
              <button
                key={item.page}
                type="button"
                onClick={() => {
                  navigate(item.page);
                  setMoreOpen(false);
                }}
                className="somi-control flex items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-hover-surface)]"
                style={{
                  color:
                    page === item.page
                      ? "var(--color-accent-primary)"
                      : "var(--color-text-secondary)",
                }}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}
