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
