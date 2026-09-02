export type ReaderDirection = "next" | "prev";
export type ReaderScreenState = "reading" | "chapter-end" | "locked";
export type ReaderStatus =
  | "idle"
  | "loading"
  | "ready"
  | "flipping"
  | "locked"
  | "error"
  | "completed";

export interface ReaderEngineState {
  currentPage: number;
  displayedPage: number;
  pendingPage: number | null;
  isFlipping: boolean;
  direction: ReaderDirection;
  screenState: ReaderScreenState;
}

export interface ReaderState {
  currentPage: number;
  pendingPage: number | null;
  status: ReaderStatus;
  direction: ReaderDirection | null;
  totalPages: number;
}

export interface PaginationConfig {
  charsPerPage: number;
}

export function createReaderState(totalPages: number): ReaderState {
  return {
    currentPage: 0,
    pendingPage: null,
    status: "ready",
    direction: null,
    totalPages: Math.max(1, totalPages),
  };
}

export function paginateChapter(
  content: string,
  config: PaginationConfig,
): string[] {
  const charsPerPage = Math.max(1, config.charsPerPage);

  if (!content.trim()) {
    return [""];
  }

  const words = content.trim().split(/\s+/);
  const pages: string[] = [];
  let buffer = "";

  for (const word of words) {
    const candidate = buffer ? `${buffer} ${word}` : word;
    if (candidate.length > charsPerPage && buffer) {
      pages.push(buffer.trim());
      buffer = word;
      continue;
    }

    buffer = candidate;
  }

  if (buffer.trim()) {
    pages.push(buffer.trim());
  }

  return pages.length > 0 ? pages : [""];
}

export function splitIntoPages(
  content: string,
  charsPerPage: number,
): string[] {
  return paginateChapter(content, { charsPerPage });
}

export function calculateProgress(
  currentPage: number,
  totalPages: number,
): number {
  if (totalPages <= 1) return 100;
  return Math.min(
    100,
    Math.max(0, Math.round((currentPage / (totalPages - 1)) * 100)),
  );
}

export function updateReaderState(
  state: ReaderEngineState,
  direction: ReaderDirection,
  totalPages: number,
): ReaderEngineState {
  const nextIndex = state.currentPage + (direction === "next" ? 1 : -1);

  if (nextIndex < 0 || nextIndex >= totalPages) {
    return { ...state, direction, isFlipping: false, pendingPage: null };
  }

  return {
    ...state,
    direction,
    isFlipping: true,
    pendingPage: nextIndex,
  };
}

export function finishReaderTurn(
  state: ReaderEngineState,
  nextPage: number,
): ReaderEngineState {
  return {
    ...state,
    currentPage: nextPage,
    displayedPage: nextPage,
    pendingPage: null,
    isFlipping: false,
  };
}

export function requestPageTransition(
  state: ReaderState,
  direction: ReaderDirection,
  totalPages: number,
): ReaderState {
  if (
    state.status === "flipping" ||
    state.status === "locked" ||
    state.status === "completed"
  ) {
    return state;
  }

  const nextIndex = state.currentPage + (direction === "next" ? 1 : -1);
  if (nextIndex < 0 || nextIndex >= totalPages) {
    return { ...state, status: "ready", pendingPage: null, direction: null };
  }

  return {
    ...state,
    totalPages: Math.max(1, totalPages),
    direction,
    status: "flipping",
    pendingPage: nextIndex,
  };
}

export function commitReaderTransition(
  state: ReaderState,
  nextPage: number,
): ReaderState {
  if (nextPage < 0 || nextPage >= Math.max(1, state.totalPages)) {
    return { ...state, status: "ready", pendingPage: null, direction: null };
  }

  return {
    ...state,
    currentPage: nextPage,
    pendingPage: null,
    status: "ready",
    direction: null,
  };
}

export function jumpToPage(state: ReaderState, page: number): ReaderState {
  if (!Number.isInteger(page) || page < 0 || page >= state.totalPages) {
    return { ...state, status: "error", pendingPage: null, direction: null };
  }

  return {
    ...state,
    currentPage: page,
    pendingPage: null,
    status: "ready",
    direction: null,
  };
}

export function resolvePageTurn(
  currentPage: number,
  totalPages: number,
  direction: ReaderDirection,
): {
  currentIndex: number;
  targetIndex: number;
  direction: ReaderDirection;
  isForward: boolean;
  canFlip: boolean;
} | null {
  if (totalPages <= 1) return null;

  const targetIndex = currentPage + (direction === "next" ? 1 : -1);
  const isForward = direction === "next";

  if (targetIndex < 0 || targetIndex >= totalPages) {
    return null;
  }

  return {
    currentIndex: currentPage,
    targetIndex,
    direction,
    isForward,
    canFlip: true,
  };
}
