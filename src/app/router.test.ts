import { describe, expect, it } from "vitest";
import { environmentFromPath, pageFromPath, routeForPage } from "./router";

describe("route configuration", () => {
  it("maps the primary app routes to their canonical paths", () => {
    expect(routeForPage("home")).toBe("/");
    expect(routeForPage("discover")).toBe("/discover");
    expect(routeForPage("library")).toBe("/library");
    expect(routeForPage("wallet")).toBe("/wallet");
    expect(routeForPage("admin-dashboard")).toBe("/admin");
    expect(routeForPage("admin-transactions")).toBe(
      "/admin/economy/transactions",
    );
    expect(routeForPage("writer-editor", "book-1", "chapter-1")).toBe(
      "/writer/books/book-1/chapters/chapter-1/edit",
    );
  });

  it("derives the correct page and environment from a pathname", () => {
    expect(pageFromPath("/discover")).toBe("discover");
    expect(pageFromPath("/writer/analytics")).toBe("writer-analytics");
    expect(pageFromPath("/admin/settings")).toBe("admin-settings");
    expect(environmentFromPath("/writer/books")).toBe("writer");
    expect(environmentFromPath("/admin/users")).toBe("admin");
    expect(environmentFromPath("/books/midnight-throne")).toBe("reader");
  });
});
