import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";

describe("Health endpoint", () => {
  it("returns a structured status payload", async () => {
    const app = createApp();
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(600);
    expect(response.body).toHaveProperty("success");
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("status");
    if (response.body.success === false) {
      expect(response.body.data.database).toBe("disconnected");
    }
  });
});
