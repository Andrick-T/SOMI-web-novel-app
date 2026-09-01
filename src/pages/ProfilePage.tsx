import { useState } from "react";
import {
  LogOut, ChevronRight, BookOpen, Clock, Flame, Star, Bell, Moon, Globe, Shield, HelpCircle, Coins, PenLine, LayoutDashboard
} from "lucide-react";
import type { CommonProps } from "../types";

export default function ProfilePage({ navigate, onLogout, coins, isLoggedIn, isWriter, isAdmin, setEnvironment }: CommonProps) {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

  if (!isLoggedIn) {
    navigate("auth");
    return null;
  }

  const stats = [
    { label: "Books Read", value: "12", icon: <BookOpen size={18} color="#e8a84c" /> },
    { label: "Hours Read", value: "47", icon: <Clock size={18} color="#e8a84c" /> },
    { label: "Day Streak", value: "8", icon: <Flame size={18} color="#c9603a" /> },
    { label: "Avg Rating", value: "4.8", icon: <Star size={18} color="#e8a84c" fill="#e8a84c" /> },
  ];

  type MenuItem = {
    icon: React.ReactNode;
    label: string;
    value?: string;
    chevron?: boolean;
    right?: React.ReactNode;
    action?: () => void;
  };

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: "Preferences",
      items: [
        {
          icon: <Bell size={18} color="#8b7ea8" />, label: "Notifications",
          right: <button
            onClick={() => setNotifications(!notifications)}
            className="w-11 h-6 rounded-full relative transition-colors duration-200"
            style={{ background: notifications ? "#e8a84c" : "#2e2945" }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-200"
              style={{ background: "#0d0b18", transform: notifications ? "translateX(21px)" : "translateX(2px)" }}
            />
          </button>
        },
        {
          icon: <Moon size={18} color="#8b7ea8" />, label: "Dark Mode",
          right: <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-11 h-6 rounded-full relative transition-colors"
            style={{ background: darkMode ? "#e8a84c" : "#2e2945" }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full transition-transform"
              style={{ background: "#0d0b18", transform: darkMode ? "translateX(21px)" : "translateX(2px)" }}
            />
          </button>
        },
        { icon: <Globe size={18} color="#8b7ea8" />, label: "Language", value: "English", chevron: true },
      ]
    },
    {
      title: "Account",
      items: [
        { icon: <Coins size={18} color="#e8a84c" />, label: "Somi Wallet", value: `${coins.toLocaleString()} coins`, chevron: true, action: () => navigate("wallet") },
        { icon: <Shield size={18} color="#8b7ea8" />, label: "Privacy & Security", chevron: true },
        { icon: <HelpCircle size={18} color="#8b7ea8" />, label: "Help & Support", chevron: true },
      ]
    }
  ];

  const readingGenres = [
    { genre: "Fantasy", pct: 45 },
    { genre: "African Culture", pct: 30 },
    { genre: "Thriller", pct: 15 },
    { genre: "Family Saga", pct: 10 },
  ];

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#0d0b18" }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center font-display text-2xl font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #e8a84c, #c9603a)", color: "#0d0b18" }}
          >
            K
          </div>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold" style={{ color: "#f0ece4" }}>Kemi Adeyemi</h1>
            <p className="text-sm" style={{ color: "#8b7ea8" }}>kemi@example.com</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Coins size={11} color="#e8a84c" />
              <span className="text-xs font-bold" style={{ color: "#e8a84c" }}>{coins.toLocaleString()} Somi Coins</span>
            </div>
          </div>
          <button
            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold"
            style={{ background: "#1a1726", color: "#8b7ea8", border: "1px solid #2e2945" }}
          >
            Edit
          </button>
        </div>
      </div>

      {/* Reading Stats */}
      <div className="px-5 mb-5">
        <div className="grid grid-cols-4 gap-2">
          {stats.map(s => (
            <div
              key={s.label}
              className="rounded-xl p-3 flex flex-col items-center gap-1"
              style={{ background: "#1a1726", border: "1px solid #2e2945" }}
            >
              {s.icon}
              <p className="font-display text-lg font-bold" style={{ color: "#f0ece4" }}>{s.value}</p>
              <p className="text-[9px] text-center leading-tight" style={{ color: "#8b7ea8" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reading breakdown */}
      <div className="px-5 mb-5">
        <div className="rounded-xl p-4" style={{ background: "#1a1726", border: "1px solid #2e2945" }}>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#8b7ea8" }}>Reading Genres</h3>
          <div className="flex flex-col gap-2.5">
            {readingGenres.map(({ genre, pct }) => (
              <div key={genre}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-semibold" style={{ color: "#f0ece4" }}>{genre}</span>
                  <span className="text-xs" style={{ color: "#e8a84c" }}>{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#2e2945" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: "linear-gradient(90deg, #e8a84c, #c9603a)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Menu sections */}
      {menuSections.map(section => (
        <div key={section.title} className="px-5 mb-4">
          <h3 className="text-[11px] uppercase tracking-widest font-bold mb-2" style={{ color: "#8b7ea8" }}>
            {section.title}
          </h3>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #2e2945" }}>
            {section.items.map((item, i) => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-white/5 transition-colors"
                style={{
                  background: "#1a1726",
                  borderBottom: i < section.items.length - 1 ? "1px solid #2e2945" : "none",
                }}
              >
                <div className="flex-shrink-0">{item.icon}</div>
                <span className="flex-1 text-sm font-medium" style={{ color: "#f0ece4" }}>{item.label}</span>
                {item.value && <span className="text-xs" style={{ color: "#8b7ea8" }}>{item.value}</span>}
                {item.right ?? (item.chevron && <ChevronRight size={16} color="#8b7ea8" />)}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Environment switching */}
      {(isWriter || isAdmin) && (
        <div className="px-5 mb-4">
          <h3 className="text-[11px] uppercase tracking-widest font-bold mb-2" style={{ color: "#8b7ea8" }}>Environments</h3>
          <div className="flex flex-col gap-2">
            {isWriter && (
              <button
                onClick={() => { setEnvironment("writer"); navigate("writer-dashboard"); }}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl active:scale-[0.98] transition-transform"
                style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(74,222,128,0.15)" }}>
                  <PenLine size={18} color="#4ade80" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold" style={{ color: "#4ade80" }}>Writer Studio</p>
                  <p className="text-xs" style={{ color: "#4a6540" }}>Manage your books and chapters</p>
                </div>
                <ChevronRight size={16} color="#4ade80" />
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => { setEnvironment("admin"); navigate("admin-dashboard"); }}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl active:scale-[0.98] transition-transform"
                style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(96,165,250,0.15)" }}>
                  <LayoutDashboard size={18} color="#60a5fa" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold" style={{ color: "#60a5fa" }}>Admin Console</p>
                  <p className="text-xs" style={{ color: "#3b5278" }}>Platform management</p>
                </div>
                <ChevronRight size={16} color="#60a5fa" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sign out */}
      <div className="px-5 mb-8">
        <button
          onClick={() => { onLogout(); navigate("home"); }}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
          style={{ background: "#1a1726", color: "#c9603a", border: "1px solid #c9603a33" }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>

      <div className="pb-4 text-center">
        <p className="text-[10px]" style={{ color: "#2e2945" }}>SOMI v1.0.0 · Cameroon</p>
      </div>
    </div>
  );
}
