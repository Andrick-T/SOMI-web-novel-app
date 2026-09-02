import { Search, Bell, Coins } from "lucide-react";
import type { Page, AppEnvironment } from "../types";
import { navigation } from "../config/designSystem";

interface TopNavProps {
  page: Page;
  navigate: (page: Page) => void;
  isLoggedIn: boolean;
  coins: number;
  isWriter: boolean;
  isAdmin: boolean;
  environment: AppEnvironment;
  setEnvironment: (env: AppEnvironment) => void;
}

export default function TopNav({
  page,
  navigate,
  isLoggedIn,
  coins,
  isWriter,
  isAdmin,
  environment,
  setEnvironment,
}: TopNavProps) {
  const isReader = environment === "reader";
  const isWriterE = environment === "writer";
  const isAdminE = environment === "admin";

  const accent = isAdminE ? "#60a5fa" : isWriterE ? "#4ade80" : "#e8a84c";
  const bg = isAdminE ? "#0e1422" : isWriterE ? "#131510" : "#0d0b18";
  const border = isAdminE
    ? "rgba(96,165,250,0.12)"
    : isWriterE
      ? "rgba(74,222,128,0.12)"
      : "#1e1c2e";

  return (
    <header
      className="hidden md:flex items-center justify-between px-6 h-14 flex-shrink-0 z-20 relative"
      style={{ background: bg, borderBottom: `1px solid ${border}` }}
    >
      {/* Logo + app label */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            setEnvironment("reader");
            navigate("home");
          }}
          className="flex items-center gap-2"
        >
          <span className="font-display text-lg font-bold gold-shimmer">
            SOMI
          </span>
          {!isReader && (
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
              style={{ background: `${accent}18`, color: accent }}
            >
              {isWriterE ? "Writer" : "Admin"}
            </span>
          )}
        </button>

        {/* Reader links */}
        {isReader && (
          <nav className="flex items-center gap-1 ml-2">
            {navigation.reader.map((link) => {
              const active = page === link.page;
              return (
                <button
                  key={link.page}
                  onClick={() => navigate(link.page)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    color: active ? "#f0ece4" : "#8b7ea8",
                    background: active ? "#ffffff0d" : "transparent",
                  }}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Writer links */}
        {isWriterE && (
          <nav className="flex items-center gap-1 ml-2">
            {navigation.writer.slice(0, 3).map(({ page: p, label }) => {
              const active = page === p;
              return (
                <button
                  key={p}
                  onClick={() => navigate(p)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    color: active ? "#4ade80" : "#4a6540",
                    background: active
                      ? "rgba(74,222,128,0.08)"
                      : "transparent",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Admin links */}
        {isAdminE && (
          <nav className="flex items-center gap-1 ml-2">
            {navigation.admin.map(({ page: p, label }) => {
              const active = page === p;
              return (
                <button
                  key={p}
                  onClick={() => navigate(p)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    color: active ? "#60a5fa" : "#3b5278",
                    background: active
                      ? "rgba(96,165,250,0.08)"
                      : "transparent",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Environment switcher */}
        {(isWriter || isAdmin) && (
          <div
            className="flex items-center gap-1 p-1 rounded-lg"
            style={{ background: "#ffffff08" }}
          >
            <button
              onClick={() => {
                setEnvironment("reader");
                navigate("home");
              }}
              className="px-2.5 py-1 rounded-md text-xs font-semibold transition-all"
              style={{
                background: isReader ? "#ffffff14" : "transparent",
                color: isReader ? "#f0ece4" : "#8b7ea8",
              }}
            >
              Read
            </button>
            {isWriter && (
              <button
                onClick={() => {
                  setEnvironment("writer");
                  navigate("writer-dashboard");
                }}
                className="px-2.5 py-1 rounded-md text-xs font-semibold transition-all"
                style={{
                  background: isWriterE
                    ? "rgba(74,222,128,0.15)"
                    : "transparent",
                  color: isWriterE ? "#4ade80" : "#8b7ea8",
                }}
              >
                Write
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => {
                  setEnvironment("admin");
                  navigate("admin-dashboard");
                }}
                className="px-2.5 py-1 rounded-md text-xs font-semibold transition-all"
                style={{
                  background: isAdminE
                    ? "rgba(96,165,250,0.15)"
                    : "transparent",
                  color: isAdminE ? "#60a5fa" : "#8b7ea8",
                }}
              >
                Admin
              </button>
            )}
          </div>
        )}

        {/* Coin balance (reader) */}
        {isLoggedIn && isReader && (
          <button
            onClick={() => navigate("wallet")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{
              background: "rgba(232,168,76,0.1)",
              border: "1px solid rgba(232,168,76,0.2)",
            }}
          >
            <Coins size={13} color="#e8a84c" />
            <span className="text-xs font-bold" style={{ color: "#e8a84c" }}>
              {coins.toLocaleString()}
            </span>
          </button>
        )}

        {/* Search */}
        {isReader && (
          <button
            onClick={() => navigate("discover")}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "#ffffff0a" }}
          >
            <Search size={15} color="#8b7ea8" />
          </button>
        )}

        {/* Notifications */}
        {isLoggedIn && (
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center relative"
            style={{ background: "#ffffff0a" }}
          >
            <Bell size={15} color="#8b7ea8" />
            <span
              className="absolute top-1 right-1 w-2 h-2 rounded-full"
              style={{ background: "#c9603a" }}
            />
          </button>
        )}

        {/* Auth / Profile */}
        {!isLoggedIn ? (
          <button
            onClick={() => navigate("auth")}
            className="px-4 py-1.5 rounded-lg text-sm font-bold"
            style={{ background: "#e8a84c", color: "#0d0b18" }}
          >
            Sign In
          </button>
        ) : (
          <button
            onClick={() => navigate("profile")}
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accent}99)`,
              color: "#0d0b18",
            }}
          >
            K
          </button>
        )}
      </div>
    </header>
  );
}
