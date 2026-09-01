import { useState, useEffect, useCallback } from "react";
import type { Page, AppEnvironment, CommonProps } from "./types";
import { books } from "./data/books";
import BottomNav from "./components/BottomNav";
import WriterNav from "./components/WriterNav";
import AdminNav from "./components/AdminNav";
import TopNav from "./components/TopNav";
import WriterSidebar from "./components/WriterSidebar";
import AdminSidebar from "./components/AdminSidebar";
import HomePage from "./pages/HomePage";
import DiscoverPage from "./pages/DiscoverPage";
import BookDetailPage from "./pages/BookDetailPage";
import ReaderPage from "./pages/ReaderPage";
import LibraryPage from "./pages/LibraryPage";
import WalletPage from "./pages/WalletPage";
import ProfilePage from "./pages/ProfilePage";
import AuthPage from "./pages/AuthPage";
import WriterDashboard from "./pages/writer/WriterDashboard";
import WriterBooks from "./pages/writer/WriterBooks";
import WriterCreate from "./pages/writer/WriterCreate";
import ChapterEditor from "./pages/writer/ChapterEditor";
import WriterAnalytics from "./pages/writer/WriterAnalytics";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminContent from "./pages/admin/AdminContent";
import AdminEconomy from "./pages/admin/AdminEconomy";
import AdminSettings from "./pages/admin/AdminSettings";

const WRITER_PAGES: Page[] = ["writer-dashboard", "writer-books", "writer-create", "writer-editor", "writer-analytics"];
const ADMIN_PAGES:  Page[] = ["admin-dashboard", "admin-users", "admin-content", "admin-economy", "admin-settings"];

export default function App() {
  const [page,             setPage]             = useState<Page>("home");
  const [selectedBookId,   setSelectedBookId]   = useState("baobab-kingdom");
  const [selectedChapterId,setSelectedChapterId]= useState("bk-c1");
  const [isLoggedIn,       setIsLoggedIn]       = useState(false);
  const [isWriter]                               = useState(true);
  const [isAdmin]                                = useState(true);
  const [coins,            setCoins]            = useState(0);
  const [libraryBooks,     setLibraryBooks]     = useState<string[]>([]);
  const [unlockedChapters, setUnlockedChapters] = useState<string[]>(["bk-c1", "bk-c2", "bk-c3", "mt-c1", "mt-c2", "mt-c3"]);
  const [environment,      setEnvironment]      = useState<AppEnvironment>("reader");

  const navigate = useCallback((target: Page, bookId?: string, chapterId?: string) => {
    if (bookId)    setSelectedBookId(bookId);
    if (chapterId) setSelectedChapterId(chapterId);
    if (WRITER_PAGES.includes(target))      setEnvironment("writer");
    else if (ADMIN_PAGES.includes(target))  setEnvironment("admin");
    else                                    setEnvironment("reader");
    setPage(target);
    window.scrollTo(0, 0);
  }, []);

  const addToLibrary    = (id: string) => setLibraryBooks(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const unlockChapter   = (id: string, cost: number) => {
    if (coins >= cost) { setCoins(c => c - cost); setUnlockedChapters(p => [...p, id]); }
  };
  const addCoins        = (amount: number) => setCoins(c => c + amount);

  const selectedBook = books.find(b => b.id === selectedBookId) ?? books[0];

  // Pages that go completely fullscreen (no nav, no shell)
  const isFullscreen = page === "reader" || page === "auth";
  // Pages that go full-height without bottom nav but still render in shell
  const isShellless  = page === "writer-editor" || page === "writer-create";

  const isWriterEnv = environment === "writer";
  const isAdminEnv  = environment === "admin";

  // Keyboard navigation support for desktop reading
  useEffect(() => {
    if (page !== "reader") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate("book", selectedBookId);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [page, navigate, selectedBookId]);

  const bgColor = isAdminEnv ? "#0e1422" : isWriterEnv ? "#131510" : "#0d0b18";

  const commonProps: CommonProps = {
    navigate,
    isLoggedIn,
    isWriter,
    isAdmin,
    coins,
    libraryBooks,
    unlockedChapters,
    addToLibrary,
    unlockChapter,
    addCoins,
    onLogin:        () => setIsLoggedIn(true),
    onLogout:       () => { setIsLoggedIn(false); setEnvironment("reader"); },
    environment,
    setEnvironment,
  };

  // ── FULLSCREEN PAGES ─────────────────────────────────
  if (isFullscreen) {
    return (
      <div style={{ width: "100vw", height: "100dvh", overflow: "hidden", background: bgColor }}>
        {page === "reader" && (
          <ReaderPage {...commonProps} book={selectedBook} chapterId={selectedChapterId} />
        )}
        {page === "auth" && <AuthPage {...commonProps} />}
      </div>
    );
  }

  // ── SHELL-LESS PAGES (writer editor, create) ─────────
  if (isShellless) {
    return (
      <div style={{ width: "100vw", minHeight: "100dvh", overflow: "auto", background: bgColor }}>
        {page === "writer-editor" && <ChapterEditor {...commonProps} />}
        {page === "writer-create"  && <WriterCreate {...commonProps} />}
      </div>
    );
  }

  // ── MAIN APP SHELL ───────────────────────────────────
  return (
    <div
      className="flex flex-col"
      style={{ minHeight: "100dvh", background: bgColor }}
    >
      {/* Top navigation — desktop/tablet only */}
      <TopNav
        page={page}
        navigate={navigate}
        isLoggedIn={isLoggedIn}
        coins={coins}
        isWriter={isWriter}
        isAdmin={isAdmin}
        environment={environment}
        setEnvironment={setEnvironment}
      />

      {/* Body row: optional sidebar + main content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Writer sidebar — desktop only */}
        {isWriterEnv && (
          <WriterSidebar page={page} navigate={navigate} setEnvironment={setEnvironment} />
        )}

        {/* Admin sidebar — desktop only */}
        {isAdminEnv && (
          <AdminSidebar page={page} navigate={navigate} setEnvironment={setEnvironment} />
        )}

        {/* Main content column */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable page content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            {/* Reader App pages */}
            {page === "home"     && <HomePage      {...commonProps} />}
            {page === "discover" && <DiscoverPage  {...commonProps} />}
            {page === "book"     && <BookDetailPage {...commonProps} book={selectedBook} />}
            {page === "library"  && <LibraryPage   {...commonProps} />}
            {page === "wallet"   && <WalletPage    {...commonProps} />}
            {page === "profile"  && <ProfilePage   {...commonProps} />}

            {/* Writer Studio */}
            {page === "writer-dashboard" && <WriterDashboard  {...commonProps} />}
            {page === "writer-books"     && <WriterBooks      {...commonProps} />}
            {page === "writer-analytics" && <WriterAnalytics  {...commonProps} />}

            {/* Admin Console */}
            {page === "admin-dashboard" && <AdminDashboard {...commonProps} />}
            {page === "admin-users"     && <AdminUsers     {...commonProps} />}
            {page === "admin-content"   && <AdminContent   {...commonProps} />}
            {page === "admin-economy"   && <AdminEconomy   {...commonProps} />}
            {page === "admin-settings"  && <AdminSettings  {...commonProps} />}
          </main>

          {/* Mobile-only bottom navigation */}
          {!isWriterEnv && !isAdminEnv && (
            <div className="md:hidden flex-shrink-0">
              <BottomNav currentPage={page} navigate={navigate} isLoggedIn={isLoggedIn} coins={coins} />
            </div>
          )}

          {isWriterEnv && (
            <div className="md:hidden flex-shrink-0">
              <WriterNav page={page} navigate={navigate} />
            </div>
          )}

          {isAdminEnv && (
            <div className="md:hidden flex-shrink-0">
              <AdminNav page={page} navigate={navigate} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
