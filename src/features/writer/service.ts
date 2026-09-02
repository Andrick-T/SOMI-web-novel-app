import type {
  ChapterStatus,
  PublicationStatus,
  SaveStatus,
  ValidationError,
  WriterAutosaveState,
  WriterBook,
  WriterChapter,
  WriterPermissionContext,
  WriterValidationResult,
} from "./types";

export const PUBLICATION_TRANSITIONS: Record<
  PublicationStatus,
  PublicationStatus[]
> = {
  DRAFT: ["EDITING"],
  EDITING: ["PROOFREADING", "READY_FOR_REVIEW", "DRAFT"],
  PROOFREADING: ["READY_FOR_REVIEW", "EDITING"],
  READY_FOR_REVIEW: ["APPROVED", "SCHEDULED", "PUBLISHED", "EDITING"],
  APPROVED: ["SCHEDULED", "PUBLISHED"],
  SCHEDULED: ["PUBLISHED", "DRAFT"],
  PUBLISHED: ["UNPUBLISHED", "ARCHIVED"],
  UNPUBLISHED: ["PUBLISHED", "EDITING", "ARCHIVED"],
  ARCHIVED: [],
};

export function canTransitionPublication(
  current: PublicationStatus,
  next: PublicationStatus,
): boolean {
  return PUBLICATION_TRANSITIONS[current]?.includes(next) ?? false;
}

export function transitionPublication(
  current: PublicationStatus,
  next: PublicationStatus,
): { success: boolean; nextStatus?: PublicationStatus; reason?: string } {
  if (current === next) {
    return {
      success: false,
      reason: "The publication status is already set to that value.",
    };
  }

  if (!canTransitionPublication(current, next)) {
    return {
      success: false,
      reason: `Cannot transition from ${current} to ${next}.`,
    };
  }

  return { success: true, nextStatus: next };
}

export function validateBook(
  input: Partial<WriterBook>,
): WriterValidationResult {
  const errors: ValidationError[] = [];

  if (!input.title || !input.title.trim()) {
    errors.push({ field: "title", message: "A book title is required." });
  }

  if (!input.synopsis || !input.synopsis.trim()) {
    errors.push({
      field: "synopsis",
      message: "A synopsis is required before publishing.",
    });
  }

  if (!input.genres || input.genres.length === 0) {
    errors.push({
      field: "genres",
      message: "At least one genre is required.",
    });
  }

  if (input.cover === "" || input.cover === undefined) {
    errors.push({
      field: "cover",
      message: "A cover is required before publishing.",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateChapter(
  input: Partial<WriterChapter>,
): WriterValidationResult {
  const errors: ValidationError[] = [];

  if (!input.title || !input.title.trim()) {
    errors.push({ field: "title", message: "A chapter title is required." });
  }

  if (!input.content || !input.content.trim()) {
    errors.push({
      field: "content",
      message: "Chapter content cannot be empty.",
    });
  }

  if (!input.number || input.number <= 0) {
    errors.push({
      field: "number",
      message: "Chapter number must be greater than zero.",
    });
  }

  if (input.price !== undefined && input.price < 0) {
    errors.push({
      field: "price",
      message: "Chapter price cannot be negative.",
    });
  }

  if (input.accessType && !["FREE", "PREMIUM"].includes(input.accessType)) {
    errors.push({
      field: "accessType",
      message: "Access type must be FREE or PREMIUM.",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function reorderChapterIds(
  currentOrder: string[],
  orderedIds: string[],
): string[] {
  const uniqueOrdered = [...new Set(orderedIds)];
  const hasAllItems = currentOrder.every((id) => uniqueOrdered.includes(id));

  if (!hasAllItems || uniqueOrdered.length !== currentOrder.length) {
    return [...currentOrder];
  }

  return uniqueOrdered;
}

export function canEditWriterContent({
  writerId,
  ownerId,
  permission,
}: WriterPermissionContext): boolean {
  if (writerId === ownerId) {
    return true;
  }

  return permission === "editor" || permission === "admin";
}

export function canApproveContent(
  writerId: string,
  ownerId: string,
  permission?: string,
): boolean {
  if (writerId === ownerId) {
    return false;
  }

  return permission === "editor" || permission === "admin";
}

export function createAutosaveState(): WriterAutosaveState {
  return { status: "CLEAN" };
}

export function updateAutosaveState(
  state: WriterAutosaveState,
  nextStatus: SaveStatus,
): WriterAutosaveState {
  const nextState: WriterAutosaveState = { ...state, status: nextStatus };

  if (nextStatus === "SAVED") {
    nextState.savedAt = new Date().toISOString();
    delete nextState.error;
  }

  if (nextStatus === "ERROR") {
    nextState.error = "Autosave failed. Please retry.";
  }

  return nextState;
}

export function estimateReadingTime(wordCount: number): number {
  if (wordCount <= 0) return 0;
  return Math.max(1, Math.ceil(wordCount / 220));
}

export function countWords(content: string): number {
  if (!content.trim()) return 0;
  return content.trim().split(/\s+/).filter(Boolean).length;
}

export function getPublicationStatusForChapter(
  chapter: Partial<WriterChapter>,
): ChapterStatus {
  return (chapter.status ?? "DRAFT") as ChapterStatus;
}
