import type { Page } from "../types";

interface Props {
  currentPage: Page;
  navigate: (page: Page) => void;
  isLoggedIn: boolean;
  coins: number;
}

const HomeIcon = ({ filled }: { filled: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const CompassIcon = ({ filled }: { filled: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    {filled
      ? <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" />
      : <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />}
  </svg>
);

const LibraryIcon = ({ filled }: { filled: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
  </svg>
);

const ProfileIcon = ({ filled }: { filled: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const WalletIcon = ({ filled }: { filled: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
    <circle cx="17" cy="15" r="1.5" fill="currentColor" />
  </svg>
);

export default function BottomNav({ currentPage, navigate, isLoggedIn, coins }: Props) {
  const items: { page: Page; label: string; Icon: React.FC<{ filled: boolean }> }[] = [
    { page: "home", label: "Home", Icon: HomeIcon },
    { page: "discover", label: "Discover", Icon: CompassIcon },
    { page: "library", label: "Library", Icon: LibraryIcon },
    { page: "wallet", label: "Wallet", Icon: WalletIcon },
    { page: isLoggedIn ? "profile" : "auth", label: isLoggedIn ? "Profile" : "Sign In", Icon: ProfileIcon },
  ];

  return (
    <nav className="flex-shrink-0 border-t" style={{ background: "#12101e", borderColor: "#2e2945" }}>
      <div className="flex justify-around items-center h-[60px] px-1">
        {items.map(({ page, label, Icon }) => {
          const isActive = currentPage === page || (page === "auth" && currentPage === "auth");
          return (
            <button
              key={page}
              onClick={() => navigate(page)}
              className="flex flex-col items-center gap-[3px] flex-1 py-2 transition-all duration-200 active:scale-90 relative"
              style={{ color: isActive ? "#e8a84c" : "#8b7ea8" }}
            >
              {page === "wallet" && coins > 0 && (
                <span
                  className="absolute top-1 right-1/4 text-[9px] font-bold px-1.5 py-px rounded-full"
                  style={{ background: "#e8a84c", color: "#0d0b18" }}
                >
                  {coins.toLocaleString()}
                </span>
              )}
              <Icon filled={isActive} />
              <span className="text-[9px] font-bold tracking-wide">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
