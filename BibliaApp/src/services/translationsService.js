import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Directory, Paths } from 'expo-file-system';

import { getTranslation, translationDownloadUrl } from '../data/translations';
import { bookList } from '../data/bookList';
import { loadBook } from '../data/booksIndex';

const storageKey = (sigla) => `@bibliaapp/translation/${sigla}`;

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

// As versões do damarals seguem a mesma ordem canônica dos 66 livros do app.
function bookIndexForAbbrev(abbrev) {
  return bookList.findIndex((b) => b.abbrev === abbrev);
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
async function mergeEmbeddedTitles(abbrev, chapters) {
  try {
    const embeddedChapters = await getEmbeddedBookChapters(abbrev);

    return chapters.map((chapter, chapterIdx) => {
      const embeddedChapter = embeddedChapters[chapterIdx] ?? [];
      return chapter.map((verse, verseIdx) => {
        const embeddedVerse = embeddedChapter[verseIdx];
        const title =
          embeddedVerse && typeof embeddedVerse === 'object' && embeddedVerse.title
            ? embeddedVerse.title
            : null;
        if (!title) return verse;
        if (verse == null) return verse;
        if (typeof verse === 'object') {
          return { ...verse, title };
        }
        return { text: verse, title };
      });
    });
  } catch (e) {
    console.warn(`[Translation] Falha ao mesclar títulos embutidos para ${abbrev}:`, e);
    return chapters;
  }
}

export async function loadTranslatedBook(sigla, abbrev) {
  const meta = getTranslation(sigla);
  if (!meta || meta.embedded) return null;

  const data = await getTranslationData(sigla);
  if (!data) return null;

  const index = bookIndexForAbbrev(abbrev);
  let book = index >= 0 ? data[index] : null;
  if (!book) {
    book = data.find((b) => (b?.abbrev ?? '').toLowerCase() === abbrev.toLowerCase());
  }
  if (!book) return null;

  const chapters = Array.isArray(book.chapters) ? book.chapters : [];
  const mergedChapters = await mergeEmbeddedTitles(abbrev, chapters);

  return {
    abbrev,
    name: meta.name,
    chapters: mergedChapters,
  };
}

export function isTranslationAvailable(sigla) {
  const meta = getTranslation(sigla);
  return !!meta && !meta.embedded;
}