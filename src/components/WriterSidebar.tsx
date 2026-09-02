import {
  LayoutDashboard,
  BookOpen,
  PenLine,
  TrendingUp,
  Plus,
  ArrowLeft,
  Coins,
} from "lucide-react";
import type { Page } from "../types";

interface Props {
  page: Page;
  navigate: (page: Page) => void;
  setEnvironment: (env: "reader" | "writer" | "admin") => void;
}

const links: { page: Page; label: string; icon: React.ElementType }[] = [
  { page: "writer-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { page: "writer-books", label: "My Books", icon: BookOpen },
  { page: "writer-analytics", label: "Analytics", icon: TrendingUp },
  { page: "writer-earnings", label: "Earnings", icon: Coins },
];

export default function WriterSidebar({
  page,
  navigate,
  setEnvironment,
}: Props) {
  return (
    <aside
      className="hidden md:flex flex-col w-52 flex-shrink-0 py-6 px-3"
      style={{
        background: "var(--color-background)",
        borderRight: "1px solid var(--color-border-subtle)",
      }}
    >
      {/* Back to reader */}
      <button
        onClick={() => {
          setEnvironment("reader");
          navigate("home");
        }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg mb-6 text-xs font-semibold transition-all hover:opacity-80"
        style={{ color: "var(--color-text-muted)" }}
      >
        <ArrowLeft size={13} />
        Reader App
      </button>

      {/* Nav links */}
      <nav className="flex flex-col gap-1 flex-1">
        {links.map((item) => {
          const active = page === item.page;
          const Icon = item.icon;
          return (
            <button
              key={item.page}
              onClick={() => navigate(item.page)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all"
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
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Quick write button */}
      <button
        onClick={() => navigate("writer-editor")}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold mt-4"
        style={{
          background: "var(--color-accent-primary)",
          color: "var(--color-background)",
        }}
      >
        <PenLine size={15} />
        Write Chapter
      </button>

      <button
        onClick={() => navigate("writer-create")}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold mt-2"
        style={{
          background: "var(--color-active-surface)",
          color: "var(--color-accent-primary)",
          border: "1px solid var(--color-border-default)",
        }}
      >
        <Plus size={15} />
        New Book
      </button>
    </aside>
  );
}
