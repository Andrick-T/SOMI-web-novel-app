import { describe, expect, it } from "vitest";
import { navigation, statusToneFor } from "./designSystem";

describe("SOMI design system", () => {
  it("maps writer and moderation statuses to shared semantic tones", () => {
    expect(statusToneFor("PUBLISHED")).toBe("success");
    expect(statusToneFor("READY_FOR_REVIEW")).toBe("warning");
    expect(statusToneFor("REJECTED")).toBe("danger");
    expect(statusToneFor("ARCHIVED")).toBe("neutral");
  });

  it("keeps every writer and admin destination discoverable from one source", () => {
    expect(navigation.writer.map((item) => item.page)).toEqual([
      "writer-dashboard",
      "writer-books",
      "writer-analytics",
      "writer-earnings",
    ]);
    expect(navigation.admin.map((item) => item.page)).toContain(
      "admin-transactions",
    );
    expect(navigation.admin.map((item) => item.page)).toContain(
      "admin-reports",
    );
  });
});
