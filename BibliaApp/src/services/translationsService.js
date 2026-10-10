import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Directory, Paths } from 'expo-file-system';

import { getTranslation, translationDownloadUrl } from '../data/translations';
import { bookList } from '../data/bookList';
import { loadBook } from '../data/booksIndex';
import { KJV_TITLES } from '../data/kjvTitles';

const storageKey = (sigla) => `@bibliaapp/translation/${sigla}`;
const REV_KEY = '@bibliaapp/translationRevs';

async function storedRevs() {
  try {
    return (await AsyncStorage.getItem(REV_KEY).then((r) => JSON.parse(r))) ?? {};
  } catch (e) {
    return {};
  }
}

async function recordRev(sigla) {
  try {
    const revs = await storedRevs();
    revs[sigla] = getTranslation(sigla)?.rev ?? 1;
    await AsyncStorage.setItem(REV_KEY, JSON.stringify(revs));
  } catch (e) {
    // ignora falha de escrita
  }
}

// Traduções baixadas ficam em arquivos no diretório de documentos do app.
// AsyncStorage tem limite de ~6 MB por banco no Android; cada tradução tem
// ~4 MB, então várias não caberiam. Arquivos em disco não têm esse teto.
const translationsDir = () => new Directory(Paths.document, 'translations');
const translationFileFor = (sigla) => new File(translationsDir(), `${sigla}.json`);

// Cache em memória das traduções baixadas (evita reparse do JSON).
const cache = new Map();

// Cache dos livros embutidos usados apenas como fonte de títulos editoriais.
const embeddedTitlesCache = new Map();

export async function downloadTranslation(sigla) {
  const url = translationDownloadUrl(sigla);
  if (!url) {
    console.error(`[Translation] Erro: Tradução ${sigla} sem URL de download configurada.`);
    throw new Error('Tradução sem URL de download');
  }

  console.log(`[Translation] Iniciando download da tradução [${sigla}] de: ${url}`);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[Translation] Falha HTTP ${res.status} (${res.statusText}) ao baixar ${sigla} de ${url}`);
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const text = await res.text();
    if (typeof text !== 'string' || text.length === 0) {
      console.error(`[Translation] Resposta vazia recebida para ${sigla}`);
      throw new Error('Resposta vazia');
    }

    console.log(`[Translation] Download de ${sigla} concluído (${(text.length / (1024 * 1024)).toFixed(2)} MB). Validando JSON...`);

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error(`[Translation] Erro ao fazer JSON.parse na tradução ${sigla}:`, parseErr.message);
      throw new Error('JSON inválido ou corrompido');
    }

    if (!Array.isArray(data) || data.length === 0) {
      console.error(`[Translation] Estrutura JSON inválida para ${sigla}: esperado array de livros não vazio.`);
      throw new Error('JSON inválido (formato de livros incorreto)');
    }

    cache.set(sigla, data);

    const file = translationFileFor(sigla);
    if (!file.parentDirectory.exists) {
      file.parentDirectory.create({ intermediates: true, idempotent: true });
    }
    file.create({ overwrite: true, intermediates: true });
    file.write(text);
    console.log(`[Translation] Tradução ${sigla} salva com sucesso em ${file.uri} (${data.length} livros).`);
    await recordRev(sigla);
    return true;
  } catch (err) {
    console.error(`[Translation] Exceção capturada ao baixar tradução ${sigla}:`, err);
    throw err;
  }
}

export async function getTranslationData(sigla) {
  if (cache.has(sigla)) return cache.get(sigla);

  const file = translationFileFor(sigla);
  if (file.exists) {
    try {
      const raw = file.textSync();
      const data = JSON.parse(raw);
      cache.set(sigla, data);
      return data;
    } catch (e) {
      console.error(`[Translation] Erro ao ler arquivo em disco para ${sigla}:`, e);
    }
  }

  // Fallback: dados de versões anteriores do app ficavam no AsyncStorage.
  const raw = await AsyncStorage.getItem(storageKey(sigla));
  if (raw) {
    try {
      const data = JSON.parse(raw);
      cache.set(sigla, data);
      // Migra para arquivo em disco e limpa o AsyncStorage (libera espaço do banco).
      try {
        if (!file.parentDirectory.exists) {
          file.parentDirectory.create({ intermediates: true, idempotent: true });
        }
        file.create({ overwrite: true, intermediates: true });
        file.write(raw);
        await AsyncStorage.removeItem(storageKey(sigla));
        console.log(`[Translation] ${sigla} migrada do AsyncStorage para ${file.uri}.`);
      } catch (migrateErr) {
        console.warn(`[Translation] Falha ao migrar ${sigla} para arquivo em disco:`, migrateErr);
      }
      return data;
    } catch (e) {
      console.error(`[Translation] Erro ao ler dados em cache do AsyncStorage para ${sigla}:`, e);
      return null;
    }
  }

  return null;
}

export async function removeTranslation(sigla) {
  cache.delete(sigla);
  const file = translationFileFor(sigla);
  if (file.exists) {
    file.delete();
  }
  await AsyncStorage.removeItem(storageKey(sigla));
  console.log(`[Translation] Tradução ${sigla} removida do dispositivo.`);
}

// As versões do damarals seguem a mesma ordem canônica dos 66 livros do app,
// mas usam abreviações próprias (ex.: "Gn", "Êx", "At"). A comparação
// ignora caixa e acentos para não depender do rótulo exato.
function normalizeAbbrev(s) {
  return (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function bookIndexForAbbrev(abbrev) {
  return bookList.findIndex((b) => b.abbrev === abbrev);
}

// Rótulos divergentes conhecidos (app -> arquivo): Atos é "At" no repositório.
const ABBREV_ALIASES = {
  atos: ['atos', 'at'],
};

function findDownloadedBook(data, abbrev) {
  if (!Array.isArray(data)) return null;
  // 1) Arquivo canônico completo (66 livros): a ordem é confiável.
  if (data.length === 66) {
    const index = bookIndexForAbbrev(abbrev);
    const positional = index >= 0 ? data[index] : null;
    if (positional && Array.isArray(positional.chapters)) return positional;
  }
  // 2) Fallback por rótulo normalizado + aliases (ex.: "Êx" -> "ex").
  const wanted = normalizeAbbrev(abbrev);
  const aliases = ABBREV_ALIASES[wanted] ?? [wanted];
  return data.find((b) => aliases.includes(normalizeAbbrev(b?.abbrev))) ?? null;
}

async function getEmbeddedBookChapters(abbrev) {
  if (embeddedTitlesCache.has(abbrev)) return embeddedTitlesCache.get(abbrev);
  const mod = await loadBook(abbrev);
  const embedded = mod?.default ?? mod;
  const chapters = embedded?.chapters ?? [];
  embeddedTitlesCache.set(abbrev, chapters);
  return chapters;
}

// As traduções baixadas (ACF, ARA etc.) vêm apenas com o texto dos versículos.
// Os títulos editoriais existem somente na NVI embutida; para manter a
// consistência visual, mesclamos os títulos da versão embutida sobre a
// tradução ativa, na mesma posição (capítulo/versículo).
function applyTitles(chapters, getTitle) {
  return chapters.map((chapter, chapterIdx) => {
    if (!Array.isArray(chapter)) return chapter;
    return chapter.map((verse, verseIdx) => {
      const title = getTitle(chapterIdx, verseIdx);
      if (!title) return verse;
      if (verse == null) return verse;
      if (typeof verse === 'object') {
        return { ...verse, title };
      }
      return { text: verse, title };
    });
  });
}

async function mergeEmbeddedTitles(abbrev, chapters) {
  try {
    const embeddedChapters = await getEmbeddedBookChapters(abbrev);
    return applyTitles(chapters, (chapterIdx, verseIdx) => {
      const embeddedVerse = (embeddedChapters[chapterIdx] ?? [])[verseIdx];
      return embeddedVerse && typeof embeddedVerse === 'object' && embeddedVerse.title
        ? embeddedVerse.title
        : null;
    });
  } catch (e) {
    console.warn(`[Translation] Falha ao mesclar títulos embutidos para ${abbrev}:`, e);
    return chapters;
  }
}

// Títulos de seção em inglês (dataset JWBickel/KJV_Pericopes, mesma
// posição capítulo/versículo). Mapa preguiçoso: "abbrev:ch:v" -> título.
let kjvTitleMap = null;
function getKjvTitleMap() {
  if (!kjvTitleMap) {
    kjvTitleMap = new Map();
    Object.entries(KJV_TITLES ?? {}).forEach(([abbrev, list]) => {
      (list ?? []).forEach(([ch, v, title]) => {
        if (title) kjvTitleMap.set(`${abbrev}:${ch}:${v}`, title);
      });
    });
  }
  return kjvTitleMap;
}

function mergeKjvTitles(abbrev, chapters) {
  try {
    const map = getKjvTitleMap();
    return applyTitles(chapters, (chapterIdx, verseIdx) =>
      map.get(`${abbrev}:${chapterIdx}:${verseIdx}`) ?? null
    );
  } catch (e) {
    console.warn(`[Translation] Falha ao mesclar títulos KJV para ${abbrev}:`, e);
    return chapters;
  }
}

export async function loadTranslatedBook(sigla, abbrev) {
  const meta = getTranslation(sigla);
  if (!meta || meta.embedded) return null;

  // Migração de formato: se o arquivo em disco é de uma revisão anterior
  // (ex.: RV1960 sem os títulos nativos em espanhol), remove e baixa de
  // novo uma única vez.
  const wantRev = meta.rev ?? 1;
  const revs = await storedRevs();
  if ((revs[sigla] ?? 1) < wantRev) {
    console.log(`[Translation] Migrando ${sigla} para rev ${wantRev}...`);
    await removeTranslation(sigla);
    try {
      await downloadTranslation(sigla);
    } catch (e) {
      console.warn(`[Translation] Falha ao migrar ${sigla}:`, e?.message ?? e);
      return null;
    }
    await recordRev(sigla);
  }

  const data = await getTranslationData(sigla);
  if (!data) return null;

  const book = findDownloadedBook(data, abbrev);
  if (!book) {
    console.warn(`[Translation] Livro ${abbrev} não encontrado em ${sigla}; caindo para embutida.`);
    return null;
  }

  const chapters = Array.isArray(book.chapters) ? book.chapters : [];
  if (!chapters.length) {
    console.warn(`[Translation] Livro ${abbrev} sem capítulos em ${sigla}; caindo para embutida.`);
    return null;
  }

  // Títulos de seção no idioma da versão:
  // 1) Se o arquivo já traz títulos nativos (ex.: RV1960 "study" em
  //    espanhol), eles prevalecem — mesma posição entre os versículos.
  // 2) KJV usa o mapa de títulos em inglês (dataset JWBickel/KJV_Pericopes).
  // 3) Versões em português sem títulos (ACF, ARA...) herdam os títulos
  //    editoriais da NVI embutida.
  // 4) Qualquer outro idioma sem títulos nativos fica sem subtítulos —
  //    nunca exibir português no meio do texto estrangeiro.
  const hasNativeTitles = chapters.some(
    (chapter) =>
      Array.isArray(chapter) &&
      chapter.some((v) => v && typeof v === 'object' && v.title)
  );
  let mergedChapters;
  if (hasNativeTitles) {
    mergedChapters = chapters;
  } else if (meta.language === 'en') {
    mergedChapters = mergeKjvTitles(abbrev, chapters);
  } else if (!meta.language || meta.language === 'pt') {
    mergedChapters = await mergeEmbeddedTitles(abbrev, chapters);
  } else {
    mergedChapters = chapters;
  }

  return {
    abbrev,
    name: book.name ?? bookList[bookIndexForAbbrev(abbrev)]?.name ?? abbrev,
    chapters: mergedChapters,
  };
}

export function isTranslationAvailable(sigla) {
  const meta = getTranslation(sigla);
  return !!meta && !meta.embedded;
}

// Confere se a tradução está realmente legível no dispositivo
// (arquivo em disco íntegro com ao menos 1 livro com capítulos).
export async function hasTranslationData(sigla) {
  const meta = getTranslation(sigla);
  if (!meta || meta.embedded) return true;
  const data = await getTranslationData(sigla);
  if (!Array.isArray(data) || !data.length) return false;
  return data.some((b) => Array.isArray(b?.chapters) && b.chapters.length > 0);
}