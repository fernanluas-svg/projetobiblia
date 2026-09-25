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
  worried: [
    {
      ref: 'Filipenses 4.6-8',
      text: 'N\u00e3o estejais inquietos por coisa alguma; antes as vossas peti\u00e7\u00f5es sejam em tudo conhecidas diante de Deus pela ora\u00e7\u00e3o e s\u00faplica, com a\u00e7\u00e3o de gra\u00e7as. E a paz de Deus, que excede todo o entendimento, guardar\u00e1 os vossos cora\u00e7\u00f5es e os vossos pensamentos em Cristo Jesus. Quanto ao mais, irm\u00e3os, tudo o que \u00e9 verdadeiro, tudo o que \u00e9 honesto, tudo o que \u00e9 justo, tudo o que \u00e9 puro, tudo o que \u00e9 am\u00e1vel, tudo o que \u00e9 de boa fama, se h\u00e1 alguma virtude, e se h\u00e1 algum louvor, nisso pensai.',
    },
    {
      ref: '1 Pedro 5.7',
      text: 'Lan\u00e7ando sobre ele toda a vossa ansiedade, porque ele tem cuidado de v\u00f3s.',
    },
    {
      ref: 'Mateus 6.31-34',
      text: 'N\u00e3o andeis, pois, inquietos, dizendo: Que comeremos, ou que beberemos, ou com que nos vestiremos? Porque todas estas coisas os gentios procuram. Decerto vosso Pai celestial bem sabe que necessitais de todas estas coisas; Mas, buscai primeiro o reino de Deus, e a sua justi\u00e7a, e todas estas coisas vos ser\u00e3o acrescentadas. N\u00e3o vos inquieteis, pois, pelo dia de amanh\u00e3, porque o dia de amanh\u00e3 cuidar\u00e1 de si mesmo. Basta a cada dia o seu mal.',
    },
    {
      ref: 'Salmos 94.19',
      text: 'Na multid\u00e3o dos meus pensamentos dentro de mim, as tuas consola\u00e7\u00f5es recrearam a minha alma.',
    },
    {
      ref: 'Salmos 121.1-2',
      text: 'Levantarei os meus olhos para os montes, de onde vem o meu socorro. O meu socorro vem do Senhor que fez o c\u00e9u e a terra.',
    },
  ],
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
  const isObj = raw && typeof raw === 'object';
  const rawRef = isObj ? raw.ref : raw;
  const trimmed = String(rawRef).trim();
  if (!trimmed) return null;

  const m = trimmed.match(/^(.*?)\s+(\d[\d\s.,\-\s]*)$/);
  if (m) {
    const book = findBook(m[1]);
    if (book) {
      const parsed = parseRest(m[2], book);
      if (parsed && isObj) parsed.text = raw.text;
      return parsed;
    }
  }

  if (!prevAbbrev) return null;
  const prevBook = getBooks().find((b) => b.abbrev === prevAbbrev);
  if (!prevBook) return null;
  const parsed = parseRest(trimmed, { abbrev: prevAbbrev, name: prevBook.name });
  if (parsed && isObj) parsed.text = raw.text;
  return parsed;
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