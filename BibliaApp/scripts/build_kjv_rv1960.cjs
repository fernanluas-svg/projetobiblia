// Gera KJV.json e RV1960.json no formato canônico do app:
//   [{ abbrev, name, chapters: [[verseText, ...], ...] }]
// Fontes:
//   KJV    -> scrollmapper/bible_databases (formats/json/KJV.json)
//   RV1960 -> d32-ux/RV1960-JSON ({livro}/{livro}-{cap}.json)
// Uso: node scripts/build_kjv_rv1960.cjs
// Saída: assets/translations/{KJV,RV1960}.json
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'assets', 'translations');
const KJV_URL =
  'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/KJV.json';
const RV_BASE = 'https://raw.githubusercontent.com/d32-ux/RV1960-JSON/master';

// Ordem canônica do app: [abbrev, capítulos, dir espanhol RV1960].
const CANON = [
  ['gn', 50, 'genesis'],
  ['ex', 40, 'exodo'],
  ['lv', 27, 'levitico'],
  ['nm', 36, 'numeros'],
  ['dt', 34, 'deuteronomio'],
  ['js', 24, 'josue'],
  ['jz', 21, 'jueces'],
  ['rt', 4, 'rut'],
  ['1sm', 31, '1-samuel'],
  ['2sm', 24, '2-samuel'],
  ['1rs', 22, '1-reyes'],
  ['2rs', 25, '2-reyes'],
  ['1cr', 29, '1-cronicas'],
  ['2cr', 36, '2-cronicas'],
  ['ed', 10, 'esdras'],
  ['ne', 13, 'nehemias'],
  ['et', 10, 'ester'],
  ['jó', 42, 'job'],
  ['sl', 150, 'salmos'],
  ['pv', 31, 'proverbios'],
  ['ec', 12, 'eclesiastes'],
  ['ct', 8, 'cantares'],
  ['is', 66, 'isaias'],
  ['jr', 52, 'jeremias'],
  ['lm', 5, 'lamentaciones'],
  ['ez', 48, 'ezequiel'],
  ['dn', 12, 'daniel'],
  ['os', 14, 'oseas'],
  ['jl', 3, 'joel'],
  ['am', 9, 'amos'],
  ['ob', 1, 'abdias'],
  ['jn', 4, 'jonas'],
  ['mq', 7, 'miqueas'],
  ['na', 3, 'nahum'],
  ['hc', 3, 'habacuc'],
  ['sf', 3, 'sofonias'],
  ['ag', 2, 'hageo'],
  ['zc', 14, 'zacarias'],
  ['ml', 4, 'malaquias'],
  ['mt', 28, 'mateo'],
  ['mc', 16, 'marcos'],
  ['lc', 24, 'lucas'],
  ['jo', 21, 'juan'],
  ['atos', 28, 'hechos'],
  ['rm', 16, 'romanos'],
  ['1co', 16, '1-corintios'],
  ['2co', 13, '2-corintios'],
  ['gl', 6, 'galatas'],
  ['ef', 6, 'efesios'],
  ['fp', 4, 'filipenses'],
  ['cl', 4, 'colosenses'],
  ['1ts', 5, '1-tesalonicenses'],
  ['2ts', 3, '2-tesalonicenses'],
  ['1tm', 6, '1-timoteo'],
  ['2tm', 4, '2-timoteo'],
  ['tt', 3, 'tito'],
  ['fm', 1, 'filemon'],
  ['hb', 13, 'hebreos'],
  ['tg', 5, 'santiago'],
  ['1pe', 5, '1-pedro'],
  ['2pe', 3, '2-pedro'],
  ['1jo', 5, '1-juan'],
  ['2jo', 1, '2-juan'],
  ['3jo', 1, '3-juan'],
  ['jd', 1, 'judas'],
  ['ap', 22, 'apocalipsis'],
];

async function fetchJson(url, retries = 3) {
  let lastErr;
  for (let i = 0; i < retries; i += 1) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw new Error(`Falha em ${url}: ${lastErr?.message}`);
}

// Pool simples de concorrência para os ~1189 capítulos RV1960.
async function mapPool(items, size, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  let done = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor;
      cursor += 1;
      results[i] = await fn(items[i], i);
      done += 1;
      if (done % 100 === 0) console.log(`  ... ${done}/${items.length}`);
    }
  }
  await Promise.all(Array.from({ length: size }, worker));
  return results;
}

async function buildKJV() {
  console.log('[KJV] Baixando scrollmapper/bible_databases KJV.json ...');
  const data = await fetchJson(KJV_URL);
  const books = data?.books;
  if (!Array.isArray(books) || books.length !== 66) {
    throw new Error(`KJV inesperado: ${books?.length} livros (esperado 66)`);
  }
  const out = books.map((b, i) => {
    const [abbrev] = CANON[i];
    if (!Array.isArray(b.chapters) || !b.chapters.length) {
      throw new Error(`KJV livro ${i} (${b?.name}) sem capítulos`);
    }
    const chapters = b.chapters.map((ch) => {
      const verses = [...(ch.verses ?? [])].sort((a, c) => a.verse - c.verse);
      if (!verses.length) throw new Error(`KJV ${b?.name} cap vazio`);
      return verses.map((v) => String(v.text ?? '').trim());
    });
    return { abbrev, name: b.name ?? abbrev, chapters };
  });
  return out;
}

async function buildRV1960() {
  console.log('[RV1960] Baixando 1189 capítulos de d32-ux/RV1960-JSON ...');
  const jobs = [];
  CANON.forEach(([abbrev, count, dir]) => {
    for (let ch = 1; ch <= count; ch += 1) {
      jobs.push({ abbrev, dir, ch });
    }
  });
  const chaptersByBook = new Map(CANON.map(([a]) => [a, []]));
  const names = new Map();
  await mapPool(jobs, 16, async ({ abbrev, dir, ch }) => {
    const url = `${RV_BASE}/${dir}/${dir}-${ch}.json`;
    const data = await fetchJson(url);
    const vers = [...(data?.vers ?? [])].sort((a, b) => a.number - b.number);
    if (!vers.length) throw new Error(`RV1960 vazio: ${url}`);
    if (!names.has(abbrev) && data?.name) names.set(abbrev, data.name);
    // Preserva os subtítulos de seção nativos em espanhol (campo "study")
    // como title — mesma posição entre os versículos.
    chaptersByBook.get(abbrev)[ch - 1] = vers.map((v) => {
      const text = String(v.verse ?? '').trim();
      const study = typeof v.study === 'string' ? v.study.trim() : '';
      return study ? { text, title: study } : text;
    });
  });
  const out = CANON.map(([abbrev, count]) => {
    const chapters = chaptersByBook.get(abbrev);
    if (chapters.length !== count || chapters.some((c) => !c || !c.length)) {
      throw new Error(`RV1960 incompleto: ${abbrev} (${chapters.filter(Boolean).length}/${count})`);
    }
    return { abbrev, name: names.get(abbrev) ?? abbrev, chapters };
  });
  return out;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const kjv = await buildKJV();
  const kjvPath = path.join(OUT_DIR, 'KJV.json');
  fs.writeFileSync(kjvPath, JSON.stringify(kjv));
  console.log(`[KJV] OK: 66 livros, ${(fs.statSync(kjvPath).size / 1048576).toFixed(2)} MB`);

  const rv = await buildRV1960();
  const rvPath = path.join(OUT_DIR, 'RV1960.json');
  fs.writeFileSync(rvPath, JSON.stringify(rv));
  console.log(`[RV1960] OK: 66 livros, ${(fs.statSync(rvPath).size / 1048576).toFixed(2)} MB`);

  const totalVerses = (arr) =>
    arr.reduce((s, b) => s + b.chapters.reduce((x, c) => x + c.length, 0), 0);
  console.log(`[RESUMO] KJV versículos: ${totalVerses(kjv)} | RV1960 versículos: ${totalVerses(rv)}`);
}

main().catch((e) => {
  console.error('ERRO:', e.message);
  process.exit(1);
});
