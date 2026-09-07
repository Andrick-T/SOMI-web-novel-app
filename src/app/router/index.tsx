import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "../auth";
import { RequireAuth, UnauthorizedPage } from "./guards";
import HomePage from "../../pages/HomePage";
import DiscoverPage from "../../pages/DiscoverPage";
import BookDetailPage from "../../pages/BookDetailPage";
import ReaderPage from "../../pages/ReaderPage";
import LibraryPage from "../../pages/LibraryPage";
import WalletPage from "../../pages/WalletPage";
import ProfilePage from "../../pages/ProfilePage";
import AuthPage from "../../pages/AuthPage";
import WriterDashboard from "../../pages/writer/WriterDashboard";
import WriterBooks from "../../pages/writer/WriterBooks";
import WriterCreate from "../../pages/writer/WriterCreate";
import ChapterEditor from "../../pages/writer/ChapterEditor";
import WriterAnalytics from "../../pages/writer/WriterAnalytics";
import WriterEarnings from "../../pages/writer/WriterEarnings";
import AdminDashboard from "../../pages/admin/AdminDashboard";
import AdminUsers from "../../pages/admin/AdminUsers";
import AdminWriters from "../../pages/admin/AdminWriters";
import AdminContent from "../../pages/admin/AdminContent";
import AdminEconomy from "../../pages/admin/AdminEconomy";
import AdminSettings from "../../pages/admin/AdminSettings";
import NotFoundPage from "../../pages/NotFoundPage";
import { bookRepository } from "../../services/repositories";
import type { CommonProps } from "../../types";

function AppRoutes() {
  const { user, isAuthenticated, login, logout } = useAuth();

  const commonProps: CommonProps = {
    navigate: (page, bookId, chapterId) => {
      const target = (() => {
        if (page === "home") return "/";
        if (page === "discover") return "/discover";
        if (page === "book" && bookId) return `/books/${bookId}`;
        if (page === "reader" && bookId && chapterId)
          return `/books/${bookId}/read/${chapterId}`;
        if (page === "library") return "/library";
        if (page === "wallet") return "/wallet";
        if (page === "profile") return "/profile";
        if (page === "auth") return "/auth";
        if (page === "writer-dashboard") return "/writer";
        if (page === "writer-books") return "/writer/books";
        if (page === "writer-create") return "/writer/books/new";
        if (page === "writer-editor" && bookId && chapterId)
          return `/writer/books/${bookId}/chapters/${chapterId}/edit`;
        if (page === "writer-analytics") return "/writer/analytics";
        if (page === "writer-earnings") return "/writer/earnings";
        if (page === "admin-dashboard") return "/admin";
        if (page === "admin-users") return "/admin/users";
        if (page === "admin-writers") return "/admin/writers";
        if (page === "admin-content") return "/admin/content";
        if (page === "admin-economy") return "/admin/economy";
        if (page === "admin-settings") return "/admin/settings";
        return "/";
      })();

      window.history.pushState({}, "", target);
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
    isLoggedIn: isAuthenticated,
    isWriter: Boolean(user && user.roles.includes("writer")),
    isAdmin: Boolean(user && user.roles.includes("admin")),
    coins: 250,
    libraryBooks: [],
    unlockedChapters: ["bk-c1", "bk-c2", "bk-c3", "mt-c1", "mt-c2", "mt-c3"],
    addToLibrary: () => undefined,
    unlockChapter: () => undefined,
    addCoins: () => undefined,
    onLogin: login,
    onLogout: logout,
    environment: "reader",
    setEnvironment: () => undefined,
  };

  const selectedBook = bookRepository.getBooks()[0];

  return (
    <Routes>
      <Route path="/" element={<HomePage {...commonProps} />} />
      <Route path="/discover" element={<DiscoverPage {...commonProps} />} />
      <Route
        path="/books/:bookId"
        element={
          selectedBook ? (
            <BookDetailPage {...commonProps} book={selectedBook} />
          ) : (
            <Navigate to="/discover" replace />
          )
        }
      />
      <Route
        path="/books/:bookId/read/:chapterId"
        element={
          selectedBook ? (
            <ReaderPage
              {...commonProps}
              book={selectedBook}
              chapterId={selectedBook.chapters[0]?.id ?? ""}
            />
          ) : (
            <Navigate to="/discover" replace />
          )
        }
      />
      <Route path="/library" element={<LibraryPage {...commonProps} />} />
      <Route path="/wallet" element={<WalletPage {...commonProps} />} />
      <Route path="/profile" element={<ProfilePage {...commonProps} />} />
      <Route path="/auth" element={<AuthPage {...commonProps} />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route element={<RequireAuth allowedRoles={["writer"]} />}>
        <Route path="/writer" element={<WriterDashboard {...commonProps} />} />
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
        <Route path="/admin" element={<AdminDashboard {...commonProps} />} />
        <Route path="/admin/users" element={<AdminUsers {...commonProps} />} />
        <Route
          path="/admin/writers"
          element={<AdminWriters {...commonProps} />}
        />
        <Route
          path="/admin/content"
          element={<AdminContent {...commonProps} />}
        />
        <Route
          path="/admin/economy"
          element={<AdminEconomy {...commonProps} />}
        />
        <Route
          path="/admin/settings"
          element={<AdminSettings {...commonProps} />}
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function AppRouter() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
