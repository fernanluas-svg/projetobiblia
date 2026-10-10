// Gera src/data/kjvTitles.js a partir do dataset JWBickel/KJV_Pericopes
// (HuggingFace): títulos de seção em inglês mapeados por versículo inicial.
// Uso: node scripts/build_kjv_titles.cjs
// Saída: src/data/kjvTitles.js -> { abbrev: [[chapterIdx, verseIdx, title]] }
const fs = require('fs');
const os = require('os');
const path = require('path');

const HF_URL =
  'https://huggingface.co/datasets/JWBickel/KJV_Pericopes/resolve/main/PericopeGroupedKJVVerses.json';
const OUT_PATH = path.join(__dirname, '..', 'src', 'data', 'kjvTitles.js');
const KJV_PATH = path.join(__dirname, '..', 'assets', 'translations', 'KJV.json');
// Títulos dos 150 salmos traduzidos da NVI ([capítulo 1-based, título]).
// O dataset não traz subtítulos por salmo (só as 5 divisões de Livros),
// então estes prevalecem na mesma posição.
const PSALM_PATH = path.join(__dirname, 'kjv_psalm_titles.json');

const BOOK_MAP = {
  genesis: 'gn',
  exodus: 'ex',
  leviticus: 'lv',
  numbers: 'nm',
  deuteronomy: 'dt',
  joshua: 'js',
  judges: 'jz',
  ruth: 'rt',
  '1 samuel': '1sm',
  '2 samuel': '2sm',
  '1 kings': '1rs',
  '2 kings': '2rs',
  '1 chronicles': '1cr',
  '2 chronicles': '2cr',
  ezra: 'ed',
  nehemiah: 'ne',
  esther: 'et',
  job: 'jó',
  psalms: 'sl',
  psalm: 'sl',
  proverbs: 'pv',
  ecclesiastes: 'ec',
  'song of solomon': 'ct',
  'song of songs': 'ct',
  canticles: 'ct',
  isaiah: 'is',
  jeremiah: 'jr',
  lamentations: 'lm',
  ezekiel: 'ez',
  daniel: 'dn',
  hosea: 'os',
  joel: 'jl',
  amos: 'am',
  obadiah: 'ob',
  jonah: 'jn',
  micah: 'mq',
  nahum: 'na',
  habakkuk: 'hc',
  zephaniah: 'sf',
  haggai: 'ag',
  zechariah: 'zc',
  malachi: 'ml',
  matthew: 'mt',
  mark: 'mc',
  luke: 'lc',
  john: 'jo',
  acts: 'atos',
  romans: 'rm',
  '1 corinthians': '1co',
  '2 corinthians': '2co',
  galatians: 'gl',
  ephesians: 'ef',
  philippians: 'fp',
  colossians: 'cl',
  '1 thessalonians': '1ts',
  '2 thessalonians': '2ts',
  '1 timothy': '1tm',
  '2 timothy': '2tm',
  titus: 'tt',
  philemon: 'fm',
  hebrews: 'hb',
  james: 'tg',
  '1 peter': '1pe',
  '2 peter': '2pe',
  '1 john': '1jo',
  '2 john': '2jo',
  '3 john': '3jo',
  jude: 'jd',
  revelation: 'ap',
  'revelation of john': 'ap',
};

function parseRef(ref) {
  const m = String(ref ?? '')
    .trim()
    .match(/^([1-3]?\s?[A-Za-z ]+?)\s+(\d+):(\d+)\s*$/);
  if (!m) return null;
  const book = m[1].replace(/\s+/g, ' ').trim().toLowerCase();
  return { book, chapter: Number(m[2]), verse: Number(m[3]) };
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return dest;
}

async function main() {
  const tmp = path.join(os.tmpdir(), 'kjv_pericopes_src.json');
  console.log('[KJV-Titles] Baixando dataset JWBickel/KJV_Pericopes ...');
  await download(HF_URL, tmp);
  const data = JSON.parse(fs.readFileSync(tmp, 'utf8'));
  if (!Array.isArray(data) || !data.length) throw new Error('Dataset vazio');

  const kjv = JSON.parse(fs.readFileSync(KJV_PATH, 'utf8'));
  const kjvByAbbrev = new Map(kjv.map((b) => [b.abbrev, b]));

  const out = {};
  const unknownBooks = new Set();
  const outOfRange = [];
  let total = 0;
  for (const entry of data) {
    const title = String(entry?.Pericope ?? '').trim();
    const parsed = parseRef(entry?.['Reference Start']);
    if (!title || !parsed) continue;
    const abbrev = BOOK_MAP[parsed.book];
    if (!abbrev) {
      unknownBooks.add(parsed.book);
      continue;
    }
    const book = kjvByAbbrev.get(abbrev);
    const chIdx = parsed.chapter - 1;
    const vIdx = parsed.verse - 1;
    if (!book || !book.chapters[chIdx] || vIdx < 0 || vIdx >= book.chapters[chIdx].length) {
      outOfRange.push(`${parsed.book} ${parsed.chapter}:${parsed.verse}`);
      continue;
    }
    (out[abbrev] = out[abbrev] || []).push([chIdx, vIdx, title]);
    total += 1;
  }
  Object.values(out).forEach((list) =>
    list.sort((a, b) => a[0] - b[0] || a[1] - b[1])
  );

  // Mescla os títulos dos salmos (sobrescrevem "Book 1..5" onde coincidem).
  const psalms = JSON.parse(fs.readFileSync(PSALM_PATH, 'utf8'));
  if (!Array.isArray(psalms) || psalms.length !== 150) {
    throw new Error(`kjv_psalm_titles.json inesperado: ${psalms?.length} itens (esperado 150)`);
  }
  const slList = (out.sl = out.sl || []);
  psalms.forEach(([ch1, title]) => {
    const chIdx = ch1 - 1;
    const at = slList.findIndex(([c, v]) => c === chIdx && v === 0);
    if (at >= 0) slList[at][2] = title;
    else slList.push([chIdx, 0, title]);
  });
  slList.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  total = Object.values(out).reduce((s, l) => s + l.length, 0);

  console.log(`[KJV-Titles] Perícopes no dataset: ${data.length} | mapeadas (+salmos): ${total}`);
  if (unknownBooks.size) console.log('[KJV-Titles] Livros desconhecidos:', [...unknownBooks]);
  console.log(`[KJV-Titles] Fora do alcance KJV: ${outOfRange.length}`, outOfRange.slice(0, 10));

  const header =
    '// Gerado por scripts/build_kjv_titles.cjs a partir do dataset\n' +
    '// JWBickel/KJV_Pericopes (HuggingFace). Títulos de seção em inglês\n' +
    '// por posição: { abbrev: [[chapterIdx, verseIdx, title], ...] }.\n';
  fs.writeFileSync(OUT_PATH, header + 'export const KJV_TITLES = ' + JSON.stringify(out) + ';\n');
  console.log(`[KJV-Titles] OK: ${(fs.statSync(OUT_PATH).size / 1024).toFixed(1)} KB em src/data/kjvTitles.js`);
}

main().catch((e) => {
  console.error('ERRO:', e.message);
  process.exit(1);
});
