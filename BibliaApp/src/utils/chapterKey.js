import { getBooks } from '../data/books';

export function makeChapterKey(abbrev, chapterIndex) {
  return `${abbrev}:${chapterIndex}`;
}

export function parseChapterKey(key) {
  const [abbrev, chapterIndexStr] = String(key).split(':');
  if (!abbrev || chapterIndexStr == null) return null;
  const chapterIndex = Number(chapterIndexStr);
  const book = getBooks().find((b) => b.abbrev === abbrev);
  if (!book) return null;
  return {
    key,
    abbrev,
    chapter: chapterIndex + 1,
    bookName: book.name,
  };
}
