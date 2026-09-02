import { useState } from "react";
import {
  LogOut,
  ChevronRight,
  BookOpen,
  Clock,
  Flame,
  Star,
  Bell,
  Moon,
  Globe,
  Shield,
  HelpCircle,
  Coins,
  PenLine,
  LayoutDashboard,
} from "lucide-react";
import { Toggle } from "../components/DesignPrimitives";
import type { CommonProps } from "../types";

export default function ProfilePage({
  navigate,
  onLogout,
  coins,
  isLoggedIn,
  isWriter,
  isAdmin,
  setEnvironment,
}: CommonProps) {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

  if (!isLoggedIn) {
    navigate("auth");
    return null;
  }

  const stats = [
    {
      label: "Books Read",
      value: "12",
      icon: <BookOpen size={18} color="var(--color-accent-primary)" />,
    },
    {
      label: "Hours Read",
      value: "47",
      icon: <Clock size={18} color="var(--color-accent-primary)" />,
    },
    {
      label: "Day Streak",
      value: "8",
      icon: <Flame size={18} color="var(--color-accent-secondary)" />,
    },
    {
      label: "Avg Rating",
      value: "4.8",
      icon: (
        <Star
          size={18}
          color="var(--color-accent-primary)"
          fill="var(--color-accent-primary)"
        />
      ),
    },
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
          icon: <Bell size={18} color="var(--color-text-muted)" />,
          label: "Notifications",
          right: (
            <Toggle
              checked={notifications}
              onChange={() => setNotifications(!notifications)}
              label="Toggle notifications"
            />
          ),
        },
        {
          icon: <Moon size={18} color="var(--color-text-muted)" />,
          label: "Dark Mode",
          right: (
            <Toggle
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
              label="Toggle dark mode"
            />
          ),
        },
        {
          icon: <Globe size={18} color="var(--color-text-muted)" />,
          label: "Language",
          value: "English",
          chevron: true,
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          icon: <Coins size={18} color="var(--color-accent-primary)" />,
          label: "Somi Wallet",
          value: `${coins.toLocaleString()} coins`,
          chevron: true,
          action: () => navigate("wallet"),
        },
        {
          icon: <Shield size={18} color="var(--color-text-muted)" />,
          label: "Privacy & Security",
          chevron: true,
        },
        {
          icon: <HelpCircle size={18} color="var(--color-text-muted)" />,
          label: "Help & Support",
          chevron: true,
        },
      ],
    },
  ];

  const readingGenres = [
    { genre: "Fantasy", pct: 45 },
    { genre: "African Culture", pct: 30 },
    { genre: "Thriller", pct: 15 },
    { genre: "Family Saga", pct: 10 },
  ];

  return (
    <div className="flex min-h-full flex-col bg-[var(--color-background)]">
      <div className="px-5 pb-6 pt-12">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--color-accent-primary),var(--color-accent-secondary))] font-display text-2xl font-bold text-[var(--color-background)]">
            K
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-bold text-[var(--color-text-primary)]">
              Kemi Adeyemi
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              kemi@example.com
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <Coins size={11} color="var(--color-accent-primary)" />
              <span className="text-xs font-bold text-[var(--color-accent-primary)]">
                {coins.toLocaleString()} Somi Coins
              </span>
            </div>
          </div>
          <button className="somi-quiet-button h-9 w-9 justify-center px-0">
            Edit
          </button>
        </div>
      </div>

      <div className="mb-5 px-5">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-1 rounded-[1rem] border border-[var(--color-border-default)] bg-[var(--color-surface)] p-3"
            >
              {s.icon}
              <p className="font-display text-lg font-bold text-[var(--color-text-primary)]">
                {s.value}
              </p>
              <p className="text-center text-[9px] leading-tight text-[var(--color-text-muted)]">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-5 px-5">
        <div className="rounded-[1rem] border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4">
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            Reading Genres
          </h3>
          <div className="flex flex-col gap-2.5">
            {readingGenres.map(({ genre, pct }) => (
              <div key={genre}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                    {genre}
                  </span>
                  <span className="text-xs text-[var(--color-accent-primary)]">
                    {pct}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-border-default)]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-accent-primary),var(--color-accent-secondary))]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-5 px-5 pb-8">
        {menuSections.map((section) => (
          <div key={section.title}>
            <h3 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              {section.title}
            </h3>
            <div className="space-y-2">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.action}
                  className="flex w-full items-center gap-3 rounded-[1rem] border border-[var(--color-border-default)] bg-[var(--color-surface)] p-3 text-left"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-surface-muted)]">
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {item.label}
                      </span>
                      {item.value && (
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {item.value}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.right ? (
                    <div className="ml-auto">{item.right}</div>
                  ) : item.chevron ? (
                    <ChevronRight size={16} color="var(--color-text-muted)" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {(isWriter || isAdmin) && (
        <div className="px-5 pb-4">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            Environments
          </h3>
          <div className="flex flex-col gap-2">
            {isWriter && (
              <button
                onClick={() => {
                  setEnvironment("writer");
                  navigate("writer-dashboard");
                }}
                className="flex items-center gap-3 rounded-[1rem] border border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.08)] p-3 text-left"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(74,222,128,0.15)]">
                  <PenLine size={18} color="#4ade80" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#4ade80]">
                    Writer Studio
                  </p>
                  <p className="text-xs text-[#4a6540]">
                    Manage your books and chapters
                  </p>
                </div>
                <ChevronRight size={16} color="#4ade80" />
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => {
                  setEnvironment("admin");
                  navigate("admin-dashboard");
                }}
                className="flex items-center gap-3 rounded-[1rem] border border-[rgba(96,165,250,0.2)] bg-[rgba(96,165,250,0.08)] p-3 text-left"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(96,165,250,0.15)]">
                  <LayoutDashboard size={18} color="#60a5fa" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#60a5fa]">
                    Admin Console
                  </p>
                  <p className="text-xs text-[#3b5278]">Platform management</p>
                </div>
                <ChevronRight size={16} color="#60a5fa" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="px-5 pb-8">
        <button
          onClick={() => {
            onLogout();
            navigate("home");
          }}
          className="flex w-full items-center justify-between rounded-[1rem] border border-[var(--color-border-default)] bg-[var(--color-surface)] px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-surface-muted)]">
              <LogOut size={18} color="var(--color-status-danger)" />
            </div>
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              Log out
            </span>
          </div>
          <ChevronRight size={16} color="var(--color-text-muted)" />
        </button>
      </div>
    </div>
  );
}
