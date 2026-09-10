import { getBookMeta } from './bookMeta';
import { getBooks } from './books';

const BOOK_ALIASES = {
  salmo: 'sl',
  salmos: 'sl',
  mateus: 'mt',
  romanos: 'rm',
  filipenses: 'fp',
  tiago: 'tg',
  '1pedro': '1pe',
  isaias: 'is',
  lucas: 'lc',
  joao: 'jo',
  eclesiastes: 'ec',
  '1timoteo': '1tm',
  hebreus: 'hb',
  '1corintios': '1co',
  colossenses: 'cl',
  '1tessalonicenses': '1ts',
  proverbios: 'pv',
  galatas: 'gl',
  marcos: 'mc',
  '1joao': '1jo',
};

const ADVICE_VERSES = {
  anxiety: [
    'Salmo 13',
    '37.3-5',
    'Mateus 6.25-34',
    'Romanos 5.3-5',
    'Filipenses 4.6-7',
    'Tiago 5.7-11',
    '1 Pedro 5.6-7',
  ],
  guilt: ['Salmo 32', '51', '130', 'Isaias 1.18', 'Lucas 15', 'João 6.37'],
  worried: ['Mateus 6.19-21', 'Eclesiastes 5.10', '1 Timóteo 6.6-10', 'Hebreus 13.5-6'],
  fear: ['Salmo 4.8', 'Isaías 41.13', 'Lucas 8.22-25', 'João 14.27', '16.33'],
  tired: ['Salmo 34.15-22', 'Isaias 40.25-31', 'Mateus 11.28-30', 'Hebreus 12.1-3'],
  anger: [
    'Mateus 5.44-48',
    'Romanos 12.17-21',
    '1 Corintios 13',
    'Colossenses 3.12-17',
    'Tiago 1.19-20',
  ],
  loneliness: [
    'Salmo 10.12-14',
    '25.16-18',
    '68.4-6',
    '146',
    'Mateus 28.20',
    'João 14.18-19',
    '1 Pedro 5.7',
  ],
  sick: [
    'Salmo 41.1-3',
    '68.19-20',
    '103.1-5',
    '146',
    'Isaías 54.10',
    'Romanos 5.1-5',
    'Tiago 5.14-15',
    '1 Pedro 5.10-11',
  ],
  grief: ['João 11.25-26', '1 Corintios 15.50-58', '1 Tessalonicenses 4.13-18'],
  envy: ['Salmo 49.16-20', 'Tiago 3.13-18'],
  temptation: [
    'Romanos 12.1-2',
    '1 Corintios 10.12-13',
    'Hebreus 2.17-18',
    '4.14-16',
    'Tiago 1.12-15',
    '4.7',
  ],
  guidance: ['Salmo 16', '25.4-10', '32.8', '119.105', 'Isaías 30.21'],
  decisions: [
    'Provérbios 3.5-6',
    '16.3',
    '1 Corintios 10.31',
    'Gálatas 6.10',
    'Tiago 1.5-8',
  ],
  prayer: [
    'Mateus 6.5-15',
    '7.7-11',
    'Marcos 14.36',
    'João 15.7',
    'Filipenses 4.6-7',
    '1 Tessalonicenses 5.17',
    '1 João 5.14-15',
  ],
  gratitude: ['Salmo 98', '100', '103'],
};

function normalizeName(name) {
  return String(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');
}

function findBook(rawName) {
  const key = normalizeName(rawName.trim());
  if (!key) return null;
  const abbrev = BOOK_ALIASES[key];
  if (!abbrev) return null;
  const book = getBooks().find((b) => b.abbrev === abbrev);
  return book ? { abbrev, name: book.name } : null;
}

function parseRest(rest, book) {
  const m = String(rest).match(/^(\d+)(?:\.(\d+)(?:-(\d+))?)?(.*)$/);
  if (!m) return null;

  const chapter1 = parseInt(m[1], 10);
  const verseStart = m[2] ? parseInt(m[2], 10) : null;
  const verseEnd = m[3] ? parseInt(m[3], 10) : null;
  const suffix = m[4] || '';

  const meta = getBookMeta(book.abbrev);
  const chaptersCount = meta ? meta.chaptersCount : Number.MAX_SAFE_INTEGER;
  const chapterIndex = Math.min(Math.max(chapter1 - 1, 0), chaptersCount - 1);

  const versesInChapter = meta ? meta.versesPerChapter[chapterIndex] : Number.MAX_SAFE_INTEGER;
  const verseIndex = verseStart
    ? Math.max(0, Math.min(verseStart - 1, versesInChapter - 1))
    : 0;

  let label = book.name;
  if (verseStart) {
    label += ` ${chapter1}:${verseStart}`;
    if (verseEnd) label += `-${verseEnd}`;
  } else {
    label += ` ${chapter1}`;
  }
  label += suffix;

  return { abbrev: book.abbrev, chapterIndex, verseIndex, label };
}

function parseItem(raw, prevAbbrev) {
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  const m = trimmed.match(/^(.*?)\s+(\d[\d\s.,\-\s]*)$/);
  if (m) {
    const book = findBook(m[1]);
    if (book) return parseRest(m[2], book);
  }

  if (!prevAbbrev) return null;
  const prevBook = getBooks().find((b) => b.abbrev === prevAbbrev);
  if (!prevBook) return null;
  return parseRest(trimmed, { abbrev: prevAbbrev, name: prevBook.name });
}

export function getAdviceVerseEntries(categoryKey) {
  const raw = ADVICE_VERSES[categoryKey];
  if (!Array.isArray(raw)) return [];

  let prevAbbrev = null;
  const entries = [];
  for (const item of raw) {
    const parsed = parseItem(item, prevAbbrev);
    if (parsed) {
      prevAbbrev = parsed.abbrev;
      entries.push(parsed);
    }
  }
  return entries;
}