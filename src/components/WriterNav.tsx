import {
  LayoutDashboard,
  BookOpen,
  PenLine,
  TrendingUp,
  CircleDollarSign,
} from "lucide-react";
import type { Page } from "../types";
import { navigation } from "../config/designSystem";

interface WriterNavProps {
  page: Page;
  navigate: (page: Page) => void;
}

const icons: Record<string, React.ElementType> = {
  "writer-dashboard": LayoutDashboard,
  "writer-books": BookOpen,
  "writer-analytics": TrendingUp,
  "writer-earnings": CircleDollarSign,
};

export default function WriterNav({ page, navigate }: WriterNavProps) {
  return (
    <nav
      className="flex items-center justify-around px-2 pt-3 pb-5"
      style={{
        background: "#131510",
        borderTop: "1px solid #1e2118",
      }}
    >
      {[
        ...navigation.writer.slice(0, 2),
        { page: "writer-editor" as Page, label: "Write" },
        ...navigation.writer.slice(2),
      ].map((item) => {
        const active = page === item.page;
        const Icon = item.page === "writer-editor" ? PenLine : icons[item.page];
        return (
          <button
            key={item.page}
            onClick={() => navigate(item.page)}
            className="flex flex-col items-center gap-1.5 px-4 py-1.5 rounded-xl active:scale-90 transition-all"
            style={{ minWidth: 60 }}
          >
            <Icon
              size={22}
              strokeWidth={active ? 2.5 : 1.8}
              color={
                active
                  ? "var(--color-accent-primary)"
                  : "var(--color-text-muted)"
              }
            />
            <span
              className="text-[10px] font-bold"
              style={{
                color: active
                  ? "var(--color-accent-primary)"
                  : "var(--color-text-muted)",
              }}
            >
              {item.label}
            </span>
            {active && (
              <div
                className="w-1 h-1 rounded-full"
                style={{ background: "var(--color-accent-primary)" }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
