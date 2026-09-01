import { LayoutDashboard, Users, BookOpen, Coins, Settings } from "lucide-react";
import type { Page } from "../types";

interface AdminNavProps {
  page: Page;
  navigate: (page: Page) => void;
}

const items = [
  { id: "admin-dashboard" as Page, label: "Home",    icon: LayoutDashboard },
  { id: "admin-users"     as Page, label: "Users",   icon: Users },
  { id: "admin-content"   as Page, label: "Content", icon: BookOpen },
  { id: "admin-economy"   as Page, label: "Economy", icon: Coins },
  { id: "admin-settings"  as Page, label: "Settings",icon: Settings },
];

export default function AdminNav({ page, navigate }: AdminNavProps) {
  return (
    <nav
      className="flex items-center justify-around px-1 pt-2.5 pb-5"
      style={{
        background: "#0e1422",
        borderTop: "1px solid rgba(96,165,250,0.1)",
      }}
    >
      {items.map(item => {
        const active = page === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl active:scale-90 transition-all"
            style={{ minWidth: 52 }}
          >
            <Icon
              size={20}
              strokeWidth={active ? 2.5 : 1.8}
              color={active ? "#60a5fa" : "#3b5278"}
            />
            <span
              className="text-[9px] font-bold"
              style={{ color: active ? "#60a5fa" : "#3b5278" }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
