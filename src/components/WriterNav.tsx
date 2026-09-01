import { LayoutDashboard, BookOpen, PenLine, TrendingUp } from "lucide-react";
import type { Page } from "../types";

interface WriterNavProps {
  page: Page;
  navigate: (page: Page) => void;
}

const items = [
  { id: "writer-dashboard" as Page,  label: "Home",     icon: LayoutDashboard },
  { id: "writer-books"    as Page,   label: "Books",    icon: BookOpen },
  { id: "writer-editor"   as Page,   label: "Write",    icon: PenLine },
  { id: "writer-analytics"as Page,   label: "Insights", icon: TrendingUp },
];

export default function WriterNav({ page, navigate }: WriterNavProps) {
  return (
    <nav
      className="flex items-center justify-around px-2 pt-3 pb-5"
      style={{
        background: "#131510",
        borderTop: "1px solid #1e2118",
      }}
    >
      {items.map(item => {
        const active = page === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            className="flex flex-col items-center gap-1.5 px-4 py-1.5 rounded-xl active:scale-90 transition-all"
            style={{ minWidth: 60 }}
          >
            <Icon
              size={22}
              strokeWidth={active ? 2.5 : 1.8}
              color={active ? "#4ade80" : "#4a6540"}
            />
            <span
              className="text-[10px] font-bold"
              style={{ color: active ? "#4ade80" : "#4a6540" }}
            >
              {item.label}
            </span>
            {active && (
              <div
                className="w-1 h-1 rounded-full"
                style={{ background: "#4ade80" }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
