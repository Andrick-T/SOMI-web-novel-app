import { books } from "../../data/books";
import type { Book, Chapter } from "./bookRepository";

export const chapterRepository = {
  getChaptersByBookId: (bookId: string): Chapter[] => {
    const book = books.find((entry) => entry.id === bookId);
    return book?.chapters ?? [];
  },
  getChapterById: (bookId: string, chapterId: string): Chapter | undefined => {
    const book = books.find((entry) => entry.id === bookId);
    return book?.chapters.find((chapter) => chapter.id === chapterId);
  },
  getBookForChapter: (chapterId: string): Book | undefined =>
    books.find((book) =>
      book.chapters.some((chapter) => chapter.id === chapterId),
    ),
};
