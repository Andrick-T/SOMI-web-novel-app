import { LayoutDashboard, Users, BookOpen, Coins, Settings, ArrowLeft, ShieldAlert } from "lucide-react";
import type { Page } from "../types";

interface Props {
  page: Page;
  navigate: (page: Page) => void;
  setEnvironment: (env: "reader" | "writer" | "admin") => void;
}

const links: { page: Page; label: string; icon: React.ElementType; badge?: number }[] = [
  { page: "admin-dashboard", label: "Overview",  icon: LayoutDashboard },
  { page: "admin-users",     label: "Users",     icon: Users },
  { page: "admin-content",   label: "Content",   icon: BookOpen, badge: 2 },
  { page: "admin-economy",   label: "Economy",   icon: Coins },
  { page: "admin-settings",  label: "Settings",  icon: Settings },
];

export default function AdminSidebar({ page, navigate, setEnvironment }: Props) {
  return (
    <aside
      className="hidden md:flex flex-col w-52 flex-shrink-0 py-6 px-3"
      style={{ background: "#08101c", borderRight: "1px solid rgba(96,165,250,0.1)" }}
    >
      {/* Back to reader */}
      <button
        onClick={() => { setEnvironment("reader"); navigate("home"); }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg mb-6 text-xs font-semibold transition-all hover:opacity-80"
        style={{ color: "#3b5278" }}
      >
        <ArrowLeft size={13} />
        Reader App
      </button>

      {/* Nav links */}
      <nav className="flex flex-col gap-1 flex-1">
        {links.map(item => {
          const active = page === item.page;
          const Icon = item.icon;
          return (
            <button
              key={item.page}
              onClick={() => navigate(item.page)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all"
              style={{
                background: active ? "rgba(96,165,250,0.12)" : "transparent",
                color: active ? "#60a5fa" : "#4a6888",
              }}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span
                  className="text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(251,113,133,0.2)", color: "#fb7185" }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Moderation alert */}
      <div
        className="mt-4 p-3 rounded-xl"
        style={{ background: "rgba(251,113,133,0.06)", border: "1px solid rgba(251,113,133,0.15)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert size={13} color="#fb7185" />
          <span className="text-xs font-bold" style={{ color: "#fb7185" }}>2 Reports</span>
        </div>
        <p className="text-[10px]" style={{ color: "#7a4055" }}>Flagged content awaits review</p>
        <button
          onClick={() => navigate("admin-content")}
          className="mt-2 text-[10px] font-semibold"
          style={{ color: "#fb7185" }}
        >
          Review now →
        </button>
      </div>
    </aside>
  );
}
