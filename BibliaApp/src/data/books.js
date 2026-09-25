import { bookList } from './bookList';
import { loadBook } from './booksIndex';

const cache = new Map();

// Fonte ativa de tradução (ex.: versão baixada do damarals). Quando definida,
// getBook carrega os capítulos da versão selecionada; senão, usa a embutida.
let activeSource = null;

export function setActiveTranslationSource(fn) {
  activeSource = fn || null;
}

export function getBooks() {
  return bookList;
}

export async function getBook(abbrev) {
  if (activeSource) {
    try {
      const book = await activeSource(abbrev);
      if (book) return book;
    } catch (e) {
      // falha na versão ativa: cai para a embutida
    }
  }
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