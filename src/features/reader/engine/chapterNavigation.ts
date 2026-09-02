export type ChapterNavigationDirection = "next" | "prev";

export function resolveChapterNavigation(
  currentIndex: number,
  totalChapters: number,
  direction: ChapterNavigationDirection,
): {
  currentIndex: number;
  targetIndex: number;
  direction: ChapterNavigationDirection;
  canNavigate: boolean;
} | null {
  if (totalChapters <= 1) return null;

  const targetIndex = currentIndex + (direction === "next" ? 1 : -1);

  if (targetIndex < 0 || targetIndex >= totalChapters) {
    return null;
  }

  return {
    currentIndex,
    targetIndex,
    direction,
    canNavigate: true,
  };
}

export function getChapterProgress(
  currentIndex: number,
  totalChapters: number,
): number {
  if (totalChapters <= 1) return 100;
  return Math.min(
    100,
    Math.max(0, Math.round(((currentIndex + 1) / totalChapters) * 100)),
  );
}
