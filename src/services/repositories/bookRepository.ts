import { books } from "../../data/books";

export type {
  Book,
  Chapter,
  Genre,
  BookStatus,
  AccessType,
} from "../../data/books";

const sortByViews = (a: (typeof books)[number], b: (typeof books)[number]) =>
  b.views - a.views;
const sortByRating = (a: (typeof books)[number], b: (typeof books)[number]) =>
  b.rating - a.rating;

export const bookRepository = {
  getBooks: () => books,
  getBookById: (id: string) => books.find((book) => book.id === id) ?? books[0],
  getFeaturedBook: () => [...books].sort(sortByViews)[0] ?? books[0],
  getPopularBooks: () => [...books].sort(sortByViews),
  getRecentlyUpdatedBooks: () => [...books].sort((a, b) => b.views - a.views),
  getTopRatedBooks: () => [...books].sort(sortByRating),
  getGenres: () => ["All", ...new Set(books.flatMap((book) => book.genres))],
};
