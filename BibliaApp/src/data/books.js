import { bookList } from './bookList';
import { loadBook } from './booksIndex';

const cache = new Map();

export function getBooks() {
  return bookList;
}

export async function getBook(abbrev) {
  if (cache.has(abbrev)) {
    return cache.get(abbrev);
  }
  const mod = await loadBook(abbrev);
  cache.set(abbrev, mod.default);
  return mod.default;
}

export function getChapter(book, chapterIndex) {
  return book?.chapters?.[chapterIndex] ?? [];
}