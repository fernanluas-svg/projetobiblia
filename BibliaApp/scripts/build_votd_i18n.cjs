// Gera src/data/versiculosPopulares.i18n.json:
//   { [id]: { en: { texto, referencia }, es: { texto, referencia } } }
// Extrai da KJV (inglês) e RV1960 (espanhol) já convertidas em
// assets/translations, usando nomes de livro no idioma de cada versão.
// Uso: node scripts/build_votd_i18n.cjs
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const POP_PATH = path.join(ROOT, 'src', 'data', 'versiculosPopulares.json');
const KJV_PATH = path.join(ROOT, 'assets', 'translations', 'KJV.json');
const RV_PATH = path.join(ROOT, 'assets', 'translations', 'RV1960.json');
const OUT_PATH = path.join(ROOT, 'src', 'data', 'versiculosPopulares.i18n.json');

const ORDER = ['gn','ex','lv','nm','dt','js','jz','rt','1sm','2sm','1rs','2rs','1cr','2cr','ed','ne','et','jó','sl','pv','ec','ct','is','jr','lm','ez','dn','os','jl','am','ob','jn','mq','na','hc','sf','ag','zc','ml','mt','mc','lc','jo','atos','rm','1co','2co','gl','ef','fp','cl','1ts','2ts','1tm','2tm','tt','fm','hb','tg','1pe','2pe','1jo','2jo','3jo','jd','ap'];

function verseText(raw) {
  const t = typeof raw === 'object' && raw !== null ? (raw.text ?? '') : (raw ?? '');
  return String(t ?? '').trim();
}

function main() {
  const pop = JSON.parse(fs.readFileSync(POP_PATH, 'utf8')).versiculos;
  const kjv = JSON.parse(fs.readFileSync(KJV_PATH, 'utf8'));
  const rv = JSON.parse(fs.readFileSync(RV_PATH, 'utf8'));
  const out = {};
  const problems = [];
  for (const v of pop) {
    const idx = ORDER.indexOf(v.abbrev);
    if (idx < 0) {
      problems.push(`id ${v.id}: abbrev ${v.abbrev} desconhecida`);
      continue;
    }
    const m = String(v.referencia ?? '').match(/(\d+):(\d+)(?:-(\d+))?\s*$/);
    const start = v.versiculo;
    const end = m?.[3] ? Number(m[3]) : start;
    const entry = {};
    for (const [lang, data] of [['en', kjv], ['es', rv]]) {
      const book = data[idx];
      const chapter = book?.chapters?.[v.capitulo - 1] ?? [];
      const parts = [];
      for (let n = start; n <= end; n += 1) {
        const t = verseText(chapter[n - 1]);
        if (t) parts.push(t);
      }
      if (!parts.length) {
        problems.push(`id ${v.id} (${v.abbrev} ${v.capitulo}:${start}): sem texto em ${lang}`);
        continue;
      }
      const range = end > start ? `${v.capitulo}:${start}-${end}` : `${v.capitulo}:${start}`;
      entry[lang] = { texto: parts.join(' '), referencia: `${book?.name ?? ''} ${range}`.trim() };
    }
    if (entry.en && entry.es) out[v.id] = entry;
  }
  if (problems.length) {
    console.log('[VOTD-i18n] Problemas:', problems.length);
    problems.slice(0, 15).forEach((p) => console.log('   ', p));
  }
  if (Object.keys(out).length !== pop.length) {
    throw new Error(`Cobertura incompleta: ${Object.keys(out).length}/${pop.length}`);
  }
  fs.writeFileSync(OUT_PATH, JSON.stringify(out));
  console.log(`[VOTD-i18n] OK: ${Object.keys(out).length} versículos EN+ES em versiculosPopulares.i18n.json (${(fs.statSync(OUT_PATH).size / 1024).toFixed(1)} KB)`);
}

main();
