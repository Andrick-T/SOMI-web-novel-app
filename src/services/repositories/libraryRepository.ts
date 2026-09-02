import { books } from "../../data/books";

export const libraryRepository = {
  getReadingProgress: () => ({
    "midnight-throne": 68,
    "sins-of-father": 32,
    "baobab-kingdom": 15,
  }),
  getLibraryBooks: (ids: string[]) =>
    books.filter((book) => ids.includes(book.id)),
};
