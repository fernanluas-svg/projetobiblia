// Catálogo de traduções disponíveis no repositório damarals/biblias
// Fonte: https://github.com/damarals/biblias
export const TRANSLATIONS = [
  {
    sigla: 'NVI',
    name: 'Nova Versão Internacional',
    namePt: 'Nova Versão Internacional',
    year: '',
    publisher: 'Biblica',
    embedded: true,
  },
  { sigla: 'ACF', name: 'Almeida Corrigida e Fiel', year: '1994', publisher: 'SBTB' },
  { sigla: 'ARA', name: 'Almeida Revista e Atualizada', year: '1993', publisher: 'SBB' },
  { sigla: 'ARC', name: 'Almeida Revista e Corrigida', year: '1995', publisher: 'SBB' },
  { sigla: 'AS21', name: 'Almeida Século 21', year: '2009', publisher: 'Vida Nova' },
  { sigla: 'JFAA', name: 'Almeida Atualizada', year: '', publisher: '' },
  { sigla: 'KJA', name: 'King James Atualizada', year: '1999', publisher: 'Abba Press' },
  { sigla: 'KJF', name: 'King James Fiel', year: '1611', publisher: 'BVBooks' },
  { sigla: 'NAA', name: 'Nova Almeida Atualizada', year: '2017', publisher: 'SBB' },
  { sigla: 'NBV', name: 'Nova Bíblia Viva', year: '2007', publisher: 'Mundo Cristão' },
  { sigla: 'NTLH', name: 'Nova Tradução na Linguagem de Hoje', year: '1988', publisher: 'SBB' },
  { sigla: 'NVT', name: 'Nova Versão Transformadora', year: '2016', publisher: 'Mundo Cristão' },
  {
    sigla: 'TB',
    name: 'Tradução Brasileira',
    year: '2010',
    publisher: 'SBB',
    domainPublic: true,
  },
  { sigla: 'BLIVRE', name: 'Bíblia Livre', year: '2018', publisher: '', domainPublic: true },
  { sigla: 'ALM1911', name: 'Almeida 1911', year: '1911', publisher: '', domainPublic: true },
  { sigla: 'OL', name: 'O Livro', year: '2000', publisher: 'Biblica' },
  { sigla: 'MENS', name: 'A Mensagem', year: '2016', publisher: 'Editora Vida' },
  {
    sigla: 'VFL',
    name: 'Versão Fácil de Ler',
    year: '2017',
    publisher: 'Bible League International',
  },
];

export function getTranslation(sigla) {
  return TRANSLATIONS.find((v) => v.sigla === sigla) ?? null;
}

export function translationDownloadUrl(sigla) {
  return `https://github.com/damarals/biblias/releases/latest/download/${sigla}.json`;
}