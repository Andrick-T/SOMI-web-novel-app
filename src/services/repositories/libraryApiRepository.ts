import { appConfig } from "../../config/env";
import { apiAuthRepository } from "./authRepository";

export type LibraryItem = {
  id: string;
  book: {
    id: string;
    title: string;
    author: string;
    coverUrl?: string | null;
    status: string;
  };
  addedAt: string;
  progress?: number;
  lastReadAt?: string | null;
};

export const apiLibraryRepository = {
  async list() {
    const result = await apiAuthRepository.authorizedRequest<{
      items: LibraryItem[];
    }>("/api/v1/library");
    return result.items;
  },
  async add(bookId: string) {
    const result = await apiAuthRepository.authorizedRequest<{
      item: LibraryItem;
    }>(`/api/v1/library/${bookId}`, { method: "POST" });
    return result.item;
  },
  async remove(bookId: string) {
    await apiAuthRepository.authorizedRequest<void>(
      `/api/v1/library/${bookId}`,
      { method: "DELETE" },
    );
  },
};

export const useApiLibrary = import.meta.env.VITE_USE_API_AUTH === "true";
export const libraryApiBaseUrl = appConfig.apiBaseUrl;
