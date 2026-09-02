export type Page =
  /* Reader App */
  | "home"
  | "discover"
  | "book"
  | "reader"
  | "library"
  | "wallet"
  | "profile"
  | "auth"
  /* Writer Studio */
  | "writer-dashboard"
  | "writer-books"
  | "writer-create"
  | "writer-editor"
  | "writer-analytics"
  | "writer-earnings"
  /* Admin Console */
  | "admin-dashboard"
  | "admin-users"
  | "admin-writers"
  | "admin-content"
  | "admin-reports"
  | "admin-economy"
  | "admin-transactions"
  | "admin-audit"
  | "admin-settings";

export type AppEnvironment = "reader" | "writer" | "admin";

export interface CommonProps {
  navigate: (page: Page, bookId?: string, chapterId?: string) => void;
  isLoggedIn: boolean;
  isWriter: boolean;
  isAdmin: boolean;
  coins: number;
  libraryBooks: string[];
  unlockedChapters: string[];
  addToLibrary: (id: string) => void;
  unlockChapter: (chapterId: string, cost: number) => void;
  addCoins: (amount: number) => void;
  onLogin: () => void;
  onLogout: () => void;
  environment: AppEnvironment;
  setEnvironment: (env: AppEnvironment) => void;
}
