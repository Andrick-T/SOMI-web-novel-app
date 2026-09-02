export type OfflineStatus =
  | "online"
  | "offline"
  | "cached"
  | "stale"
  | "pending-sync";

export interface OfflineChapterRecord {
  id: string;
  bookId: string;
  chapterId: string;
  title: string;
  bookTitle?: string;
  content: string;
  savedAt: string;
  updatedAt: string;
  size: number;
  status: "cached" | "stale" | "pending-sync";
}

export const parseOfflineStatus = (value: string): OfflineStatus => {
  switch (value) {
    case "offline":
    case "cached":
    case "stale":
    case "pending-sync":
      return value;
    default:
      return "online";
  }
};

export const createOfflineChapterRecord = ({
  bookId,
  chapterId,
  title,
  content,
  bookTitle,
}: {
  bookId: string;
  chapterId: string;
  title: string;
  content: string;
  bookTitle?: string;
}): OfflineChapterRecord => ({
  id: `${bookId}:${chapterId}`,
  bookId,
  chapterId,
  title,
  bookTitle,
  content,
  savedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  size: new Blob([content]).size,
  status: "cached",
});

const OFFLINE_CACHE_KEY = "somi-offline-cache";

const readCache = (): Record<string, OfflineChapterRecord> => {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(OFFLINE_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, OfflineChapterRecord>) : {};
  } catch {
    return {};
  }
};

const writeCache = (cache: Record<string, OfflineChapterRecord>) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore when storage is unavailable
  }
};

const openOfflineDatabase = async () => {
  if (typeof indexedDB === "undefined") return null;

  return await new Promise<IDBDatabase | null>((resolve) => {
    const request = indexedDB.open("somi-offline-db", 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("chapters")) {
        db.createObjectStore("chapters", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
};

export const isOfflineContentAvailable = (
  bookId: string,
  chapterId: string,
) => {
  const snapshot = readCache();
  return Boolean(snapshot[`${bookId}:${chapterId}`]);
};

export const offlineStorage = {
  async saveOfflineChapter(
    record: OfflineChapterRecord,
  ): Promise<OfflineChapterRecord | null> {
    const cache = readCache();
    cache[record.id] = record;
    writeCache(cache);

    const db = await openOfflineDatabase();
    if (!db) return record;

    return await new Promise<OfflineChapterRecord | null>((resolve) => {
      const tx = db.transaction("chapters", "readwrite");
      const store = tx.objectStore("chapters");
      store.put(record);
      tx.oncomplete = () => resolve(record);
      tx.onerror = () => resolve(record);
    });
  },

  async getOfflineChapter(
    bookId: string,
    chapterId: string,
  ): Promise<OfflineChapterRecord | null> {
    const id = `${bookId}:${chapterId}`;
    const cache = readCache();
    if (cache[id]) return cache[id];

    const db = await openOfflineDatabase();
    if (!db) return null;

    return await new Promise<OfflineChapterRecord | null>((resolve) => {
      const tx = db.transaction("chapters", "readonly");
      const store = tx.objectStore("chapters");
      const request = store.get(id);
      request.onsuccess = () =>
        resolve((request.result as OfflineChapterRecord | undefined) ?? null);
      request.onerror = () => resolve(null);
    });
  },

  async listOfflineChapters(): Promise<OfflineChapterRecord[]> {
    const cache = readCache();
    if (Object.keys(cache).length > 0) {
      return Object.values(cache).sort((a, b) =>
        b.savedAt.localeCompare(a.savedAt),
      );
    }

    const db = await openOfflineDatabase();
    if (!db) return [];

    return await new Promise<OfflineChapterRecord[]>((resolve) => {
      const tx = db.transaction("chapters", "readonly");
      const store = tx.objectStore("chapters");
      const request = store.getAll();
      request.onsuccess = () =>
        resolve((request.result as OfflineChapterRecord[]) ?? []);
      request.onerror = () => resolve([]);
    });
  },

  async removeOfflineChapter(
    bookId: string,
    chapterId: string,
  ): Promise<boolean> {
    const id = `${bookId}:${chapterId}`;
    const cache = readCache();
    delete cache[id];
    writeCache(cache);

    const db = await openOfflineDatabase();
    if (!db) return true;

    return await new Promise<boolean>((resolve) => {
      const tx = db.transaction("chapters", "readwrite");
      const store = tx.objectStore("chapters");
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  },

  async clear() {
    const cache = {} as Record<string, OfflineChapterRecord>;
    writeCache(cache);

    const db = await openOfflineDatabase();
    if (!db) return;

    const tx = db.transaction("chapters", "readwrite");
    tx.objectStore("chapters").clear();
  },
};

export const syncPendingChanges = async () => {
  const pending = await offlineStorage.listOfflineChapters();
  return {
    pending: pending.filter((item) => item.status === "pending-sync").length,
    synced: pending.filter((item) => item.status !== "pending-sync").length,
    mode: "local-only" as const,
    note: "This sync foundation is intentionally local-only until the Phase 7 backend is available.",
  };
};
