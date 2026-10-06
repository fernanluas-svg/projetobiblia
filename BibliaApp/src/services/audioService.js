import { File, Directory, Paths } from 'expo-file-system';

// Repositório público de áudios da Bíblia (HelioGiroto/BibliaFalada).
// Estrutura: audios/<SIGLA>/<Livro Abreviado> <Capítulo>.mp3
// Ex.: audios/ACF/Gn 1.mp3  ->  https://raw.githubusercontent.com/.../audios/ACF/Gn%201.mp3
export const AUDIO_BASE_URL =
  'https://raw.githubusercontent.com/HelioGiroto/BibliaFalada/main/audios';

// Traduções que hoje possuem áudio no repositório (extensível).
export const AUDIO_VERSIONS = ['ACF'];

// Mapeia as abreviaturas internas do app para o padrão usado nos arquivos do repositório.
const ABBREV_FIX = {
  ex: 'Ex',
  atos: 'At',
  jó: 'Jó',
};

export function audioBookAbbrev(abbrev) {
  if (!abbrev) return '';
  if (ABBREV_FIX[abbrev]) return ABBREV_FIX[abbrev];
  // Capitaliza a primeira letra (ex.: gn -> Gn, 1sm -> 1Sm, 1co -> 1Co).
  return abbrev.replace(/[a-zà-úãõç]/i, (ch) => ch.toUpperCase());
}

// chapterNumber é 1-based (o 1º capítulo é "1").
export function audioFileName(abbrev, chapterNumber) {
  return `${audioBookAbbrev(abbrev)} ${chapterNumber}.mp3`;
}

// Monta dinamicamente o link raw para streaming de qualquer livro/capítulo/versão.
export function buildAudioUrl(sigla, abbrev, chapterNumber) {
  const fileName = audioFileName(abbrev, chapterNumber);
  return `${AUDIO_BASE_URL}/${encodeURIComponent(sigla)}/${encodeURIComponent(fileName)}`;
}

export function audioRootFor(sigla) {
  return new Directory(Paths.document, 'audios', sigla);
}

export function localAudioFile(sigla, abbrev, chapterNumber) {
  return new File(audioRootFor(sigla), audioFileName(abbrev, chapterNumber));
}

export function hasLocalAudio(sigla, abbrev, chapterNumber) {
  try {
    return localAudioFile(sigla, abbrev, chapterNumber).exists;
  } catch (e) {
    return false;
  }
}

// Baixa o capítulo em áudio para uso offline. Retorna a uri local.
export async function downloadAudio(sigla, abbrev, chapterNumber) {
  const dir = audioRootFor(sigla);
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  const dest = localAudioFile(sigla, abbrev, chapterNumber);
  await File.downloadFileAsync(buildAudioUrl(sigla, abbrev, chapterNumber), dest);
  return dest.uri;
}

export async function deleteAudio(sigla, abbrev, chapterNumber) {
  const file = localAudioFile(sigla, abbrev, chapterNumber);
  if (file.exists) {
    file.delete();
  }
}

// ---------------------------------------------------------------------------
// Sincronização versículo ↔ áudio (estimativa ponderada + calibração).
// O repositório entrega 1 MP3 corrido por capítulo, sem marcações de tempo.
// Cada versículo recebe um peso proporcional ao seu tamanho real:
//   peso = max(caracteres, MIN) + BASE (pausa/respiro por versículo)
//        + palavras * WORD_WEIGHT
// A BASE evita que versículos curtos ganhem fatias curtas demais (era o que
// fazia o destaque correr mais rápido que a voz: o narrador faz pausa entre
// versículos e a vinheta inicial desloca tudo).
// LEAD_IN/TRAILING descontam vinheta e respiro final da duração total.
// LAG atrasa globalmente a troca do destaque para casar com a voz.
// Retorna [{ start, end }] em segundos, na ordem dos versículos.
// Ajuste fino: mexa apenas em AUDIO_SYNC abaixo.
// ---------------------------------------------------------------------------
export const AUDIO_SYNC = {
  LEAD_IN_SECONDS: 1.5,
  TRAILING_SECONDS: 1.0,
  BASE_WEIGHT_CHARS: 60,
  MIN_WEIGHT_CHARS: 24,
  WORD_WEIGHT: 6,
  LAG_SECONDS: 1.1,
};

function verseWeight(text) {
  const str = typeof text === 'string' ? text.trim() : '';
  const chars = Math.max(str.length, AUDIO_SYNC.MIN_WEIGHT_CHARS);
  const words = str ? str.split(/\s+/).length : 1;
  return chars + AUDIO_SYNC.BASE_WEIGHT_CHARS + words * AUDIO_SYNC.WORD_WEIGHT;
}

export function estimateVerseTimings(verseTexts, durationSeconds) {
  const total = Number(durationSeconds) || 0;
  const n = Array.isArray(verseTexts) ? verseTexts.length : 0;
  if (!n || total <= 0) return [];
  const leadIn = Math.min(Math.max(AUDIO_SYNC.LEAD_IN_SECONDS, 0), total * 0.2);
  const trailing = Math.min(Math.max(AUDIO_SYNC.TRAILING_SECONDS, 0), total * 0.15);
  const usable = Math.max(total - leadIn - trailing, total * 0.5);
  const weights = verseTexts.map(verseWeight);
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  let cursor = 0;
  return weights.map((w) => {
    const start = leadIn + (cursor / sum) * usable;
    cursor += w;
    const end = leadIn + (cursor / sum) * usable;
    return { start, end };
  });
}

export function findActiveVerseIndex(timings, currentTimeSeconds, lagSeconds = AUDIO_SYNC.LAG_SECONDS) {
  if (!Array.isArray(timings) || timings.length === 0) return -1;
  const lag = Number.isFinite(lagSeconds) ? lagSeconds : 0;
  const t = (Number(currentTimeSeconds) || 0) - lag;
  if (t < timings[0].start) return 0;
  const last = timings.length - 1;
  if (t >= timings[last].end) return last;
  for (let i = 0; i < timings.length; i += 1) {
    if (t >= timings[i].start && t < timings[i].end) return i;
  }
  return -1;
}