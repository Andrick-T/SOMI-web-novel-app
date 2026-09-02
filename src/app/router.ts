import type { AppEnvironment, Page } from "../types";

export const routeForPage = (
  target: Page,
  bookId?: string,
  chapterId?: string,
): string => {
  switch (target) {
    case "home":
      return "/";
    case "discover":
      return "/discover";
    case "book":
      return bookId ? `/books/${bookId}` : "/";
    case "reader":
      return bookId && chapterId
        ? `/books/${bookId}/read/${chapterId}`
        : bookId
          ? `/books/${bookId}`
          : "/";
    case "library":
      return "/library";
    case "wallet":
      return "/wallet";
    case "profile":
      return "/profile";
    case "auth":
      return "/auth";
    case "writer-dashboard":
      return "/writer";
    case "writer-books":
      return "/writer/books";
    case "writer-create":
      return "/writer/books/new";
    case "writer-editor":
      return bookId && chapterId
        ? `/writer/books/${bookId}/chapters/${chapterId}/edit`
        : "/writer/books/new";
    case "writer-analytics":
      return "/writer/analytics";
    case "writer-earnings":
      return "/writer/earnings";
    case "admin-dashboard":
      return "/admin";
    case "admin-users":
      return bookId ? `/admin/users/${bookId}` : "/admin/users";
    case "admin-writers":
      return "/admin/writers";
    case "admin-content":
      return bookId ? `/admin/content/${bookId}` : "/admin/content";
    case "admin-reports":
      return "/admin/reports";
    case "admin-economy":
      return "/admin/economy";
    case "admin-transactions":
      return "/admin/economy/transactions";
    case "admin-audit":
      return "/admin/audit";
    case "admin-settings":
      return "/admin/settings";
    default:
      return "/";
  }
};

export const pageFromPath = (pathname: string): Page => {
  if (pathname === "/") return "home";
  if (pathname === "/discover") return "discover";
  if (pathname.startsWith("/books/")) {
    if (pathname.includes("/read/")) return "reader";
    return "book";
  }
  if (pathname === "/library") return "library";
  if (pathname === "/wallet") return "wallet";
  if (pathname === "/profile") return "profile";
  if (pathname === "/auth") return "auth";
  if (pathname === "/writer" || pathname === "/writer/")
    return "writer-dashboard";
  if (pathname === "/writer/books") return "writer-books";
  if (pathname === "/writer/books/new") return "writer-create";
  if (pathname.includes("/chapters/") && pathname.includes("/edit"))
    return "writer-editor";
  if (pathname === "/writer/analytics") return "writer-analytics";
  if (pathname === "/writer/earnings") return "writer-earnings";
  if (pathname === "/admin" || pathname === "/admin/") return "admin-dashboard";
  if (pathname === "/admin/users" || pathname.startsWith("/admin/users/"))
    return "admin-users";
  if (pathname === "/admin/writers") return "admin-writers";
  if (pathname === "/admin/content" || pathname.startsWith("/admin/content/"))
    return "admin-content";
  if (pathname === "/admin/reports") return "admin-reports";
  if (pathname === "/admin/economy") return "admin-economy";
  if (pathname === "/admin/economy/transactions") return "admin-transactions";
  if (pathname === "/admin/audit") return "admin-audit";
  if (pathname === "/admin/settings") return "admin-settings";
  return "home";
};

export const environmentFromPath = (pathname: string): AppEnvironment => {
  if (pathname.startsWith("/writer")) return "writer";
  if (pathname.startsWith("/admin")) return "admin";
  return "reader";
};

export const isFullscreenRoute = (pathname: string): boolean => {
  return pathname === "/auth" || pathname.includes("/read/");
};

export const isShelllessRoute = (pathname: string): boolean => {
  return (
    pathname === "/writer/books/new" ||
    (pathname.includes("/chapters/") && pathname.includes("/edit"))
  );
};
