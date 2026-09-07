import type { ReadingProgress } from "../../features/reader/types";
import { apiAuthRepository } from "./authRepository";

type ApiProgress = {
  bookId: string;
  chapterId: string;
  progressPercent: number;
  position: number;
  lastReadAt: string;
  updatedAt: string;
};

const toReaderProgress = (entry: ApiProgress): ReadingProgress => ({
  userId: "authenticated-user",
  bookId: entry.bookId,
  chapterId: entry.chapterId,
  page: 1,
  totalPages: 1,
  progressPercentage: entry.progressPercent,
  position: entry.position,
  lastReadAt: entry.lastReadAt,
});

export const apiReadingProgressRepository = {
  async getRecent() {
    const result = await apiAuthRepository.authorizedRequest<{
      items: ApiProgress[];
    }>("/api/v1/reading-progress");
    return result.items.map(toReaderProgress);
  },
  async getBookProgress(bookId: string) {
    const result = await apiAuthRepository.authorizedRequest<{
      items: ApiProgress[];
    }>(`/api/v1/books/${bookId}/reading-progress`);
    return result.items.map(toReaderProgress);
  },
  async getContinueReading() {
    const result = await apiAuthRepository.authorizedRequest<{
      item: ApiProgress | null;
    }>("/api/v1/reading-progress/continue");
    return result.item ? toReaderProgress(result.item) : undefined;
  },
  async save(progress: ReadingProgress) {
    const result = await apiAuthRepository.authorizedRequest<{
      item: ApiProgress;
    }>(
      `/api/v1/books/${progress.bookId}/chapters/${progress.chapterId}/reading-progress`,
      {
        method: "PUT",
        body: JSON.stringify({
          progressPercent: progress.progressPercentage,
          position: progress.position ?? 0,
          updatedAt: progress.lastReadAt,
        }),
      },
    );
    return toReaderProgress(result.item);
  },
};
