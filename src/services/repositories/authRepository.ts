import { appConfig } from "../../config/env";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "reader" | "writer" | "admin";
  roles: Array<"reader" | "writer" | "admin">;
  status: "active" | "suspended" | "pending";
  createdAt: string;
};
type AuthResponse = { user: AuthUser; accessToken: string };

class ApiAuthRepository {
  private accessToken: string | null =
    typeof window === "undefined"
      ? null
      : window.sessionStorage.getItem("somi_access_token");
  private refreshRequest: Promise<string | null> | null = null;
  private authVersion = 0;

  private setAccessToken(token: string | null) {
    this.accessToken = token;
    if (typeof window === "undefined") return;
    if (token) window.sessionStorage.setItem("somi_access_token", token);
    else window.sessionStorage.removeItem("somi_access_token");
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    retry = true,
  ): Promise<T> {
    const tokenAtRequest = this.accessToken;
    const versionAtRequest = this.authVersion;
    const headers = new Headers(init.headers);
    if (!headers.has("Content-Type"))
      headers.set("Content-Type", "application/json");
    if (this.accessToken)
      headers.set("Authorization", `Bearer ${this.accessToken}`);
    const baseUrl = appConfig.apiBaseUrl.replace(/\/$/, "");
    const requestUrl = path.startsWith("/api/v1/")
      ? `${baseUrl}${path}`
      : `${baseUrl}/api/v1/auth${path}`;
    const response = await fetch(requestUrl, {
      ...init,
      headers,
      credentials: "include",
    });
    if (
      response.status === 401 &&
      retry &&
      path !== "/refresh" &&
      path !== "/login"
    ) {
      if (versionAtRequest !== this.authVersion) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.error?.message ?? "Authentication request failed.",
        );
      }
      const token = await this.refresh();
      if (token) return this.request<T>(path, init, false);
      if (this.accessToken === tokenAtRequest) this.setAccessToken(null);
    }
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error?.message ?? "Authentication request failed.");
    }
    return response.status === 204 ? (undefined as T) : response.json();
  }

  private async refresh() {
    if (!this.refreshRequest)
      this.refreshRequest = this.request<AuthResponse>(
        "/refresh",
        { method: "POST", body: JSON.stringify({}) },
        false,
      )
        .then((result) => {
          this.setAccessToken(result.accessToken);
          return result.accessToken;
        })
        .catch(() => null)
        .finally(() => {
          this.refreshRequest = null;
        });
    return this.refreshRequest;
  }

  async login(email: string, password: string) {
    this.authVersion += 1;
    const result = await this.request<AuthResponse>(
      "/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      false,
    );
    this.setAccessToken(result.accessToken);
    return result.user;
  }
  async register(email: string, password: string, name: string) {
    this.authVersion += 1;
    const result = await this.request<AuthResponse>(
      "/register",
      { method: "POST", body: JSON.stringify({ email, password, name }) },
      false,
    );
    this.setAccessToken(result.accessToken);
    return result.user;
  }
  async me() {
    const result = await this.request<{ user: AuthUser }>("/me");
    return result.user;
  }
  async logout() {
    this.authVersion += 1;
    await this.request<void>("/logout", { method: "POST" }, false);
    this.setAccessToken(null);
  }
  async authorizedRequest<T>(path: string, init: RequestInit = {}) {
    return this.request<T>(path, init);
  }

  async authorizedBinaryRequest<T>(path: string, init: RequestInit = {}) {
    return this.request<T>(path, init);
  }
}

export const apiAuthRepository = new ApiAuthRepository();
