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