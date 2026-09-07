import { useState, useEffect, useCallback, Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import type { Page, AppEnvironment, CommonProps } from "./types";
import { AuthProvider, useAuth } from "./app/auth";
import { RequireAuth, UnauthorizedPage } from "./app/router/guards";
import {
  createWallet,
  unlockChapterEntitlement,
  type ChapterEntitlement,
} from "./features/economy/service";
import {
  apiWalletRepository,
  useApiEconomy,
} from "./services/repositories/walletRepository";
import { appConfig } from "./config/env";
import { useNetworkStatus } from "./features/network/networkStatus";
import {
  apiBookRepository,
  apiChapterRepository,
  bookRepository,
} from "./services/repositories";
import {
  apiLibraryRepository,
  useApiLibrary,
} from "./services/repositories/libraryApiRepository";
import { hydrateRecentReadingProgress } from "./features/reader/services/readingProgressService";
import BottomNav from "./components/BottomNav";
import WriterNav from "./components/WriterNav";
import AdminNav from "./components/AdminNav";
import TopNav from "./components/TopNav";
import WriterSidebar from "./components/WriterSidebar";
import AdminSidebar from "./components/AdminSidebar";
import ErrorBoundary from "./components/ErrorBoundary";
import Metadata from "./components/Metadata";

const HomePage = lazy(() => import("./pages/HomePage"));
const DiscoverPage = lazy(() => import("./pages/DiscoverPage"));
const BookDetailPage = lazy(() => import("./pages/BookDetailPage"));
const ReaderPage = lazy(() => import("./pages/ReaderPage"));
const LibraryPage = lazy(() => import("./pages/LibraryPage"));
const WalletPage = lazy(() => import("./pages/WalletPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const WriterDashboard = lazy(() => import("./pages/writer/WriterDashboard"));
const WriterBooks = lazy(() => import("./pages/writer/WriterBooks"));
const WriterCreate = lazy(() => import("./pages/writer/WriterCreate"));
const ChapterEditor = lazy(() => import("./pages/writer/ChapterEditor"));
const WriterAnalytics = lazy(() => import("./pages/writer/WriterAnalytics"));
const WriterEarnings = lazy(() => import("./pages/writer/WriterEarnings"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminUserDetail = lazy(() => import("./pages/admin/AdminUserDetail"));
const AdminWriters = lazy(() => import("./pages/admin/AdminWriters"));
const AdminContent = lazy(() => import("./pages/admin/AdminContent"));
const AdminContentDetail = lazy(
  () => import("./pages/admin/AdminContentDetail"),
);
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminEconomy = lazy(() => import("./pages/admin/AdminEconomy"));
const AdminTransactions = lazy(() => import("./pages/admin/AdminTransactions"));
const AdminAudit = lazy(() => import("./pages/admin/AdminAudit"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
import {
  environmentFromPath,
  isFullscreenRoute,
  isShelllessRoute,
  pageFromPath,
  routeForPage,
} from "./app/router";

const WRITER_PAGES: Page[] = [
  "writer-dashboard",
  "writer-books",
  "writer-create",
  "writer-editor",
  "writer-analytics",
  "writer-earnings",
];
const ADMIN_PAGES: Page[] = [
  "admin-dashboard",
  "admin-users",
  "admin-writers",
  "admin-content",
  "admin-reports",
  "admin-economy",
  "admin-transactions",
  "admin-audit",
  "admin-settings",
];

function RouteLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6">
      <div className="text-center">
        <div className="mx-auto mb-3 h-10 w-10 animate-pulse rounded-full border-2 border-[#e8a84c]/40 border-t-[#e8a84c]" />
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8b7ea8]">
          Loading SOMI
        </p>
      </div>
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const currentPage = pageFromPath(pathname);
  const routeMatch = pathname.match(/^\/books\/([^/]+)(?:\/read\/([^/]+))?$/);
  const bookIdFromPath = routeMatch?.[1] ?? undefined;
  const chapterIdFromPath = routeMatch?.[2] ?? undefined;
  const { user, isAuthenticated, login, logout, hasRole } = useAuth();
  const { isOnline } = useNetworkStatus();
  const isLoggedIn = isAuthenticated;
  const isWriter = hasRole("writer");
  const isAdmin = hasRole("admin");
  const [wallet, setWallet] = useState(() =>
    createWallet({
      userId: user?.id ?? "guest-user",
      balance: useApiEconomy ? 0 : 250,
    }),
  );
  const [libraryBooks, setLibraryBooks] = useState<string[]>([]);
  const [entitlements, setEntitlements] = useState<ChapterEntitlement[]>([
    {
      userId: user?.id ?? "guest-user",
      bookId: "bk",
      chapterId: "bk-c1",
      status: "UNLOCKED",
      pricePaid: 0,
      coinsSpent: 0,
      unlockedAt: new Date().toISOString(),
    },
    {
      userId: user?.id ?? "guest-user",
      bookId: "bk",
      chapterId: "bk-c2",
      status: "UNLOCKED",
      pricePaid: 0,
      coinsSpent: 0,
      unlockedAt: new Date().toISOString(),
    },
    {
      userId: user?.id ?? "guest-user",
      bookId: "bk",
      chapterId: "bk-c3",
      status: "UNLOCKED",
      pricePaid: 0,
      coinsSpent: 0,
      unlockedAt: new Date().toISOString(),
    },
    {
      userId: user?.id ?? "guest-user",
      bookId: "mt",
      chapterId: "mt-c1",
      status: "UNLOCKED",
      pricePaid: 0,
      coinsSpent: 0,
      unlockedAt: new Date().toISOString(),
    },
    {
      userId: user?.id ?? "guest-user",
      bookId: "mt",
      chapterId: "mt-c2",
      status: "UNLOCKED",
      pricePaid: 0,
      coinsSpent: 0,
      unlockedAt: new Date().toISOString(),
    },
    {
      userId: user?.id ?? "guest-user",
      bookId: "mt",
      chapterId: "mt-c3",
      status: "UNLOCKED",
      pricePaid: 0,
      coinsSpent: 0,
      unlockedAt: new Date().toISOString(),
    },
  ]);
  const [environment, setEnvironment] = useState<AppEnvironment>(
    environmentFromPath(pathname),
  );
  const [apiBooks, setApiBooks] = useState<
    (typeof bookRepository extends { getBooks: () => infer T } ? T : never)[]
  >([]);
  const [apiError, setApiError] = useState<Error | null>(null);
  const [apiLoading, setApiLoading] = useState(
    import.meta.env.VITE_USE_API_CONTENT === "true",
  );

  useEffect(() => {
    if (!useApiEconomy || !isAuthenticated || !user) {
      if (!isAuthenticated) {
        setWallet(createWallet({ userId: "guest-user", balance: 0 }));
        setEntitlements([]);
      }
      return;
    }
    const authenticatedUserId = user.id;
    setWallet(createWallet({ userId: authenticatedUserId, balance: 0 }));
    void apiWalletRepository.getWallet().then((remoteWallet) => {
      if (user?.id === authenticatedUserId && isAuthenticated) {
        setWallet(
          createWallet({
            userId: authenticatedUserId,
            balance: remoteWallet.balance,
          }),
        );
      }
    });
  }, [isAuthenticated, user]);

  useEffect(() => {
    setEnvironment(environmentFromPath(pathname));
  }, [pathname]);

  const navigateTo = useCallback(
    (target: Page, bookId?: string, chapterId?: string) => {
      const url = routeForPage(target, bookId, chapterId);
      window.scrollTo(0, 0);
      navigate(url);
    },
    [navigate],
  );

  useEffect(() => {
    if (!useApiLibrary || !isAuthenticated) {
      if (!isAuthenticated) setLibraryBooks([]);
      return;
    }
    const authenticatedUserId = user?.id;
    void apiLibraryRepository.list().then((items) => {
      if (authenticatedUserId === user?.id && isAuthenticated) {
        setLibraryBooks(items.map((item) => item.book.id));
      }
    });
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (isAuthenticated)
      void hydrateRecentReadingProgress().catch(() => undefined);
  }, [isAuthenticated]);

  const addToLibrary = (id: string) => {
    if (useApiLibrary) {
      const isSaved = libraryBooks.includes(id);
      setLibraryBooks((current) =>
        isSaved ? current.filter((bookId) => bookId !== id) : [...current, id],
      );
      void (
        isSaved ? apiLibraryRepository.remove(id) : apiLibraryRepository.add(id)
      ).catch(() => {
        setLibraryBooks((current) =>
          isSaved
            ? [...current, id]
            : current.filter((bookId) => bookId !== id),
        );
      });
      return;
    }
    setLibraryBooks((current) =>
      current.includes(id)
        ? current.filter((bookId) => bookId !== id)
        : [...current, id],
    );
  };

  const unlockedChapters = entitlements
    .filter((entitlement) => entitlement.status === "UNLOCKED")
    .map((entitlement) => entitlement.chapterId);

  const unlockChapter = async (id: string, cost: number) => {
    if (!selectedBook) return;

    if (useApiEconomy) {
      const result = await apiWalletRepository.unlock(selectedBook.id, id);
      setWallet((current) =>
        createWallet({ userId: current.userId, balance: result.balance }),
      );
      setEntitlements((current) => [
        ...current,
        {
          userId: user?.id ?? "",
          bookId: selectedBook.id,
          chapterId: id,
          status: "UNLOCKED",
          pricePaid: cost,
          coinsSpent: cost,
          unlockedAt: new Date().toISOString(),
        },
      ]);
      return;
    }

    const result = unlockChapterEntitlement({
      userId: user?.id ?? "guest-user",
      bookId: selectedBook.id,
      chapterId: id,
      priceCoins: cost,
      wallet,
      existingEntitlements: entitlements,
    });

    if (result.success && result.wallet) {
      setWallet(result.wallet);
      setEntitlements(result.entitlements);
    }
  };
  const addCoins = (amount: number) =>
    setWallet((current) =>
      createWallet({
        userId: current.userId,
        balance: current.balance + amount,
      }),
    );

  const coins = wallet.balance;

  useEffect(() => {
    if (import.meta.env.VITE_USE_API_CONTENT === "true") {
      void apiBookRepository.loadBooks().then((loadedBooks) => {
        setApiBooks(loadedBooks);
        setApiError(apiBookRepository.error);
        setApiLoading(false);
      });
    }
  }, []);

  const books =
    import.meta.env.VITE_USE_API_CONTENT === "true"
      ? apiBooks
      : bookRepository.getBooks();
  const [detailBook, setDetailBook] = useState<
    (typeof books)[number] | undefined
  >();
  const [chapterBook, setChapterBook] = useState<
    (typeof books)[number] | undefined
  >();

  useEffect(() => {
    if (import.meta.env.VITE_USE_API_CONTENT !== "true" || !bookIdFromPath) {
      setDetailBook(undefined);
      return;
    }
    if (apiBooks.some((book) => book.id === bookIdFromPath)) return;
    void apiBookRepository.getBookDetail(bookIdFromPath).then((book) => {
      setDetailBook(book);
      setApiError(apiBookRepository.error);
    });
  }, [apiBooks, bookIdFromPath]);

  useEffect(() => {
    if (import.meta.env.VITE_USE_API_CONTENT !== "true" || !chapterIdFromPath) {
      setChapterBook(undefined);
      return;
    }
    void apiChapterRepository
      .getChapterById(bookIdFromPath ?? "", chapterIdFromPath)
      .then(async (chapter) => {
        if (!chapter) {
          setChapterBook(undefined);
          return;
        }
        const book =
          apiBooks.find((entry) => entry.id === bookIdFromPath) ?? detailBook;
        if (book) {
          setChapterBook({
            ...book,
            chapters: book.chapters.map((entry) =>
              entry.id === chapter.id ? chapter : entry,
            ),
          });
        }
      });
  }, [apiBooks, bookIdFromPath, chapterIdFromPath, detailBook]);

  const selectedBook =
    chapterBook ??
    detailBook ??
    (bookIdFromPath
      ? books.find((book) => book.id === bookIdFromPath)
      : (books[0] ?? undefined));
  const selectedChapterId =
    chapterIdFromPath ?? selectedBook?.chapters?.[0]?.id ?? "";

  useEffect(() => {
    if (!useApiEconomy || !isAuthenticated || !user || !selectedBook) return;
    const authenticatedUserId = user.id;
    void Promise.all(
      selectedBook.chapters
        .filter((chapter) => chapter.accessType === "PREMIUM")
        .map(async (chapter) => ({
          chapter,
          entitlement: await apiWalletRepository.getEntitlement(
            selectedBook.id,
            chapter.id,
          ),
        })),
    )
      .then((entries) => {
        if (user?.id !== authenticatedUserId || !isAuthenticated) return;
        setEntitlements(
          entries
            .filter((entry) => entry.entitlement.entitled)
            .map(({ chapter }) => ({
              userId: authenticatedUserId,
              bookId: selectedBook.id,
              chapterId: chapter.id,
              status: "UNLOCKED",
              pricePaid: chapter.price,
              coinsSpent: chapter.price,
              unlockedAt: new Date().toISOString(),
            })),
        );
      })
      .catch(() => undefined);
  }, [isAuthenticated, selectedBook, user]);

  const metaTitle =
    pathname === "/"
      ? "SOMI — Read. Discover. Write."
      : pathname === "/discover"
        ? "Discover stories — SOMI"
        : pathname.startsWith("/books/") && !pathname.includes("/read/")
          ? `${selectedBook?.title ?? "Story"} — Read on SOMI`
          : pathname.includes("/read/")
            ? `${selectedBook?.title ?? "Story"} — Chapter ${selectedChapterId || "1"} | SOMI`
            : currentPage === "library"
              ? "Your library — SOMI"
              : currentPage === "wallet"
                ? "Wallet — SOMI"
                : currentPage === "auth"
                  ? "Sign in — SOMI"
                  : "SOMI";

  const metaDescription =
    pathname.startsWith("/books/") && !pathname.includes("/read/")
      ? (selectedBook?.synopsis ??
        "Discover stories, follow your favorite writers and immerse yourself in books on SOMI.")
      : "Discover stories, follow your favorite writers and immerse yourself in books on SOMI.";

  const isFullscreen = isFullscreenRoute(pathname);
  const isShellless = isShelllessRoute(pathname);
  const isWriterEnv = environment === "writer";
  const isAdminEnv = environment === "admin";
  const bgColor = isAdminEnv ? "#0e1422" : isWriterEnv ? "#131510" : "#0d0b18";

  useEffect(() => {
    if (currentPage !== "reader" || !selectedBook) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const bookId = bookIdFromPath ?? selectedBook.id;
        navigateTo("book", bookId);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [bookIdFromPath, currentPage, navigateTo, selectedBook]);

  const commonProps: CommonProps = {
    navigate: navigateTo,
    isLoggedIn,
    isWriter,
    isAdmin,
    coins: wallet.balance,
    libraryBooks,
    unlockedChapters,
    addToLibrary,
    unlockChapter,
    addCoins,
    onLogin: async (credentials) => {
      await login(
        credentials ? { ...credentials, role: "reader" } : { role: "reader" },
      );
      setEnvironment("reader");
    },
    onLogout: async () => {
      await logout();
      setEnvironment("reader");
      navigateTo("home");
    },
    environment,
    setEnvironment,
  };

  if (isFullscreen) {
    return (
      <>
        <Metadata
          title={metaTitle}
          description={metaDescription}
          pathname={pathname}
          url={`${appConfig.appUrl}${pathname}`}
          image={selectedBook?.heroImage ?? ""}
        />
        <div
          style={{
            width: "100vw",
            height: "100dvh",
            overflow: "hidden",
            background: bgColor,
          }}
        >
          {pathname.includes("/read/") && (
            <Suspense fallback={<RouteLoading />}>
              <ReaderPage
                {...commonProps}
                book={selectedBook}
                chapterId={selectedChapterId}
              />
            </Suspense>
          )}
          {pathname === "/auth" && (
            <Suspense fallback={<RouteLoading />}>
              <AuthPage {...commonProps} />
            </Suspense>
          )}
        </div>
      </>
    );
  }

  if (isShellless) {
    return (
      <>
        <Metadata
          title={metaTitle}
          description={metaDescription}
          pathname={pathname}
          url={`${appConfig.appUrl}${pathname}`}
        />
        <div
          style={{
            width: "100vw",
            minHeight: "100dvh",
            overflow: "auto",
            background: bgColor,
          }}
        >
          {pathname === "/writer/books/new" && (
            <Suspense fallback={<RouteLoading />}>
              <WriterCreate {...commonProps} />
            </Suspense>
          )}
          {pathname.includes("/chapters/") && pathname.includes("/edit") && (
            <Suspense fallback={<RouteLoading />}>
              <ChapterEditor {...commonProps} />
            </Suspense>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <Metadata
        title={metaTitle}
        description={metaDescription}
        pathname={pathname}
        url={`${appConfig.appUrl}${pathname}`}
        image={selectedBook?.heroImage ?? ""}
      />
      <div
        className="flex flex-col"
        data-environment={environment}
        style={{ minHeight: "100dvh", background: bgColor }}
      >
        {!isOnline && (
          <div
            role="status"
            aria-live="polite"
            className="border-b border-[#2e2945] bg-[#231f35] px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f0ece4]"
          >
            Offline mode
          </div>
        )}
        <TopNav
          page={currentPage}
          navigate={navigateTo}
          isLoggedIn={isLoggedIn}
          coins={coins}
          isWriter={isWriter}
          isAdmin={isAdmin}
          environment={environment}
          setEnvironment={setEnvironment}
        />

        <div className="flex flex-1 overflow-hidden">
          {isWriterEnv && (
            <WriterSidebar
              page={currentPage}
              navigate={navigateTo}
              setEnvironment={setEnvironment}
            />
          )}
          {isAdminEnv && (
            <AdminSidebar
              page={currentPage}
              navigate={navigateTo}
              setEnvironment={setEnvironment}
            />
          )}

          <div className="flex flex-col flex-1 overflow-hidden">
            <main className="flex-1 overflow-y-auto overflow-x-hidden">
              {apiLoading ? (
                <RouteLoading />
              ) : apiError ? (
                <div className="somi-home min-h-full">
                  <div className="somi-home-inner flex min-h-[70vh] items-center justify-center px-6 py-16">
                    <div className="somi-state max-w-xl" role="alert">
                      <h2>Catalog unavailable</h2>
                      <p>{apiError.message}</p>
                      <button
                        className="somi-quiet-button"
                        onClick={() => window.location.reload()}
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Suspense fallback={<RouteLoading />}>
                  <Routes>
                    <Route path="/" element={<HomePage {...commonProps} />} />
                    <Route
                      path="/discover"
                      element={<DiscoverPage {...commonProps} />}
                    />
                    <Route
                      path="/books/:bookId"
                      element={
                        <BookDetailPage {...commonProps} book={selectedBook} />
                      }
                    />
                    <Route
                      path="/books/:bookId/read/:chapterId"
                      element={
                        <ReaderPage
                          {...commonProps}
                          book={selectedBook}
                          chapterId={selectedChapterId}
                        />
                      }
                    />
                    <Route
                      path="/library"
                      element={<LibraryPage {...commonProps} />}
                    />
                    <Route
                      path="/wallet"
                      element={<WalletPage {...commonProps} />}
                    />
                    <Route
                      path="/profile"
                      element={<ProfilePage {...commonProps} />}
                    />
                    <Route
                      path="/auth"
                      element={<AuthPage {...commonProps} />}
                    />
                    <Route
                      path="/unauthorized"
                      element={<UnauthorizedPage />}
                    />

                    <Route element={<RequireAuth allowedRoles={["writer"]} />}>
                      <Route
                        path="/writer"
                        element={<WriterDashboard {...commonProps} />}
                      />
                      <Route
                        path="/writer/books"
                        element={<WriterBooks {...commonProps} />}
                      />
                      <Route
                        path="/writer/books/new"
                        element={<WriterCreate {...commonProps} />}
                      />
                      <Route
                        path="/writer/books/:bookId/chapters/:chapterId/edit"
                        element={<ChapterEditor {...commonProps} />}
                      />
                      <Route
                        path="/writer/analytics"
                        element={<WriterAnalytics {...commonProps} />}
                      />
                      <Route
                        path="/writer/earnings"
                        element={<WriterEarnings {...commonProps} />}
                      />
                    </Route>

                    <Route element={<RequireAuth allowedRoles={["admin"]} />}>
                      <Route
                        path="/admin"
                        element={<AdminDashboard {...commonProps} />}
                      />
                      <Route
                        path="/admin/users"
                        element={<AdminUsers {...commonProps} />}
                      />
                      <Route
                        path="/admin/users/:userId"
                        element={<AdminUserDetail {...commonProps} />}
                      />
                      <Route
                        path="/admin/writers"
                        element={<AdminWriters {...commonProps} />}
                      />
                      <Route
                        path="/admin/content"
                        element={<AdminContent {...commonProps} />}
                      />
                      <Route
                        path="/admin/content/:bookId"
                        element={<AdminContentDetail {...commonProps} />}
                      />
                      <Route
                        path="/admin/reports"
                        element={<AdminReports {...commonProps} />}
                      />
                      <Route
                        path="/admin/economy"
                        element={<AdminEconomy {...commonProps} />}
                      />
                      <Route
                        path="/admin/economy/transactions"
                        element={<AdminTransactions {...commonProps} />}
                      />
                      <Route
                        path="/admin/audit"
                        element={<AdminAudit {...commonProps} />}
                      />
                      <Route
                        path="/admin/settings"
                        element={<AdminSettings {...commonProps} />}
                      />
                    </Route>

                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              )}
            </main>

            {!isWriterEnv && !isAdminEnv && (
              <div className="md:hidden flex-shrink-0">
                <BottomNav
                  currentPage={currentPage}
                  navigate={navigateTo}
                  isLoggedIn={isLoggedIn}
                  coins={coins}
                />
              </div>
            )}

            {isWriterEnv && (
              <div className="md:hidden flex-shrink-0">
                <WriterNav page={currentPage} navigate={navigateTo} />
              </div>
            )}

            {isAdminEnv && (
              <div className="md:hidden flex-shrink-0">
                <AdminNav page={currentPage} navigate={navigateTo} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
