import { apiAuthRepository } from "../../services/repositories/authRepository";
import type { PlatformSettings } from "./types";

type ApiAuditEvent = {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  timestamp: string;
};

type ApiAuditResponse = {
  items: ApiAuditEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ApiPlatformSettings = PlatformSettings & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};


export type AdminWithdrawal = {
  id: string; writerId: string; status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  coins: number; amountCfa: number; currency: string; exchangeRateCfa: number; amount: number;
  payoutMethod: string; payoutAccount: string; payoutAccountName: string | null;
  failureCount: number; failureMessage: string | null; createdAt: string; updatedAt: string;
  writer?: { id: string; email: string; username: string; profile?: { displayName: string | null } | null };
};
export type AdminSupportTicket = {
  id: string; userId: string; category: string; subject: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"; relatedWithdrawalId: string | null;
  createdAt: string; updatedAt: string; user: { id: string; email: string; username: string };
  messages: Array<{ id: string; senderId: string; body: string; createdAt: string }>;
};

class ApiAdminRepository {
  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    return apiAuthRepository.authorizedRequest<T>(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...init.headers,
      },
    });
  }


  async getWithdrawals(params?: { page?: number; limit?: number; status?: string; writerId?: string }) {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page)); if (params?.limit) q.set("limit", String(params.limit));
    if (params?.status && params.status !== "ALL") q.set("status", params.status); if (params?.writerId) q.set("writerId", params.writerId);
    const suffix = q.toString() ? "?" + q.toString() : "";
    return this.request<{ items: AdminWithdrawal[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>("/api/v1/admin/withdrawals" + suffix);
  }
  async getWithdrawal(id: string) { return (await this.request<{ withdrawal: AdminWithdrawal }>("/api/v1/admin/withdrawals/" + id)).withdrawal; }
  async processWithdrawal(id: string) { return (await this.request<{ withdrawal: AdminWithdrawal }>("/api/v1/admin/withdrawals/" + id + "/process", { method: "POST" })).withdrawal; }
  async completeWithdrawal(id: string) { return (await this.request<{ withdrawal: AdminWithdrawal }>("/api/v1/admin/withdrawals/" + id + "/complete", { method: "POST" })).withdrawal; }
  async failWithdrawal(id: string, failureMessage: string) {
    return this.request<{ withdrawal: AdminWithdrawal; supportRequired: boolean }>("/api/v1/admin/withdrawals/" + id + "/fail", { method: "POST", body: JSON.stringify({ failureMessage }) });
  }
  async getSupportTickets(params?: { page?: number; limit?: number; status?: string; priority?: string }) {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page)); if (params?.limit) q.set("limit", String(params.limit));
    if (params?.status && params.status !== "ALL") q.set("status", params.status); if (params?.priority && params.priority !== "ALL") q.set("priority", params.priority);
    const suffix = q.toString() ? "?" + q.toString() : "";
    return this.request<{ items: AdminSupportTicket[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>("/api/v1/admin/support/tickets" + suffix);
  }
  async replySupportTicket(id: string, body: string) {
    return (await this.request<{ message: AdminSupportTicket["messages"][number] }>("/api/v1/admin/support/tickets/" + id + "/messages", { method: "POST", body: JSON.stringify({ body }) })).message;
  }
  async updateSupportTicket(id: string, update: { status?: AdminSupportTicket["status"]; priority?: AdminSupportTicket["priority"] }) {
    return (await this.request<{ ticket: AdminSupportTicket }>("/api/v1/admin/support/tickets/" + id, { method: "PATCH", body: JSON.stringify(update) })).ticket;
  }

  async getAuditEvents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    action?: string;
    targetType?: string;
  }): Promise<ApiAuditResponse> {
    const searchParams = new URLSearchParams();

    if (params?.page !== undefined) {
      searchParams.set("page", String(params.page));
    }

    if (params?.limit !== undefined) {
      searchParams.set("limit", String(params.limit));
    }

    if (params?.search?.trim()) {
      searchParams.set("search", params.search.trim());
    }

    if (params?.action && params.action !== "ALL") {
      searchParams.set("action", params.action);
    }

    if (params?.targetType && params.targetType !== "ALL") {
      searchParams.set("targetType", params.targetType);
    }

    const query = searchParams.toString();

    return this.request<ApiAuditResponse>(
      `/api/v1/admin/audit${query ? `?${query}` : ""}`,
    );
  }

  async getPlatformSettings(): Promise<ApiPlatformSettings> {
    const result = await this.request<{
      settings: ApiPlatformSettings;
    }>("/api/v1/admin/settings");

    return result.settings;
  }

  async updatePlatformSettings(
    settings: Partial<PlatformSettings>,
  ): Promise<ApiPlatformSettings> {
    const result = await this.request<{
      settings: ApiPlatformSettings;
    }>("/api/v1/admin/settings", {
      method: "PATCH",
      body: JSON.stringify(settings),
    });

    return result.settings;
  }
}

export const apiAdminRepository = new ApiAdminRepository();
