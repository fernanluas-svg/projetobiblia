import AsyncStorage from '@react-native-async-storage/async-storage';

const ACHIEVEMENTS_KEY = '@bibliaapp/quizAchievements';
const STATS_KEY = '@bibliaapp/quizStats';

const LEVEL_COLORS = {
  Iniciante: '#169B4E',
  'Intermediário': '#D97706',
  'Avançado': '#DC2626',
  'Lendário': '#7C3AED',
};

const EMPTY_STATS = {
  started: false,
  matches: 0,
  correct: 0,
  perfectCount: 0,
  streakPerfect: 0,
  perfectInterCount: 0,
  streakPerfectInter: 0,
  perfectHardCount: 0,
  streakPerfectHard: 0,
  playedDays: 0,
  lastPlayedDate: '',
  firstStartedAt: 0,
  lastMatchAt: 0,
};

export const MEDALS = [
  {
    id: 'first_step_faith',
    level: 'Iniciante',
    icon: 'footsteps',
    name: 'Primeiro Passo na Fé',
    description: 'Iniciou o quiz pela primeira vez.',
    metrics: (s) => [{ label: 'Jornada iniciada', current: s.started ? 1 : 0, target: 1 }],
  },
  {
    id: 'divine_perfection',
    level: 'Iniciante',
    icon: 'diamond',
    name: 'Perfeição Divina',
    description: 'Completou uma partida com 100% de respostas corretas.',
    metrics: (s) => [{ label: 'Partidas perfeitas (geral)', current: s.perfectCount, target: 1 }],
  },
  {
    id: 'illuminated_mind',
    level: 'Iniciante',
    icon: 'bulb',
    name: 'Mente Iluminada',
    description: 'Acertou 100% das perguntas 3 vezes (acumulado, sem precisar ser em sequência).',
    metrics: (s) => [{ label: 'Partidas perfeitas (acumulado)', current: s.perfectCount, target: 3 }],
  },
  {
    id: 'prophet_focus',
    level: 'Iniciante',
    icon: 'eye',
    name: 'Foco de Profeta',
    description: 'Conseguiu 100% de acertos 5 vezes seguidas (streak).',
    metrics: (s) => [{ label: 'Perfeitas seguidas (geral)', current: s.streakPerfect, target: 5 }],
  },
  {
    id: 'steadfast_word',
    level: 'Iniciante',
    icon: 'shield-checkmark',
    name: 'Inabalável na Palavra',
    description: 'Conseguiu 100% de acertos 10 vezes seguidas (streak).',
    metrics: (s) => [{ label: 'Perfeitas seguidas (geral)', current: s.streakPerfect, target: 10 }],
  },
  {
    id: 'attentive_disciple',
    level: 'Intermediário',
    icon: 'book',
    name: 'Discípulo Atento',
    description: 'Alcançou 100% de acertos 5 vezes seguidas no modo intermediário.',
    metrics: (s) => [
      { label: 'Perfeitas seguidas (Intermediário)', current: s.streakPerfectInter, target: 5 },
    ],
  },
  {
    id: 'joshua_warrior',
    level: 'Intermediário',
    icon: 'rocket',
    name: 'Guerreiro de Josué',
    description: 'Completou 25 quizzes no total.',
    metrics: (s) => [{ label: 'Partidas completadas', current: s.matches, target: 25 }],
  },
  {
    id: 'covenant_guardian',
    level: 'Intermediário',
    icon: 'shield',
    name: 'Guardião da Aliança',
    description: 'Acertou 50 perguntas no total acumulado do jogo.',
    metrics: (s) => [{ label: 'Acertos acumulados', current: s.correct, target: 50 }],
  },
  {
    id: 'manuscript_master',
    level: 'Intermediário',
    icon: 'reader',
    name: 'Mestre dos Manuscritos',
    description: 'Completou 50 quizzes no total.',
    metrics: (s) => [{ label: 'Partidas completadas', current: s.matches, target: 50 }],
  },
  {
    id: 'scripture_erudition',
    level: 'Intermediário',
    icon: 'library',
    name: 'Erudição das Escrituras',
    description: 'Acertou 200 perguntas no total acumulado.',
    metrics: (s) => [{ label: 'Acertos acumulados', current: s.correct, target: 200 }],
  },
  {
    id: 'dawn_watchman',
    level: 'Avançado',
    icon: 'sunny',
    name: 'Vigia da Alvorada',
    description: 'Jogou o quiz em 7 dias diferentes (hábito contínuo).',
    metrics: (s) => [{ label: 'Dias diferentes', current: s.playedDays, target: 7 }],
  },
  {
    id: 'moses_torch',
    level: 'Avançado',
    icon: 'flame',
    name: 'Tocha de Moisés',
    description: 'Acertou 100% das perguntas 10 vezes no modo intermediário (acumulado).',
    metrics: (s) => [
      { label: 'Perfeitas (Intermediário)', current: s.perfectInterCount, target: 10 },
    ],
  },
  {
    id: 'solomon_wisdom',
    level: 'Avançado',
    icon: 'school',
    name: 'Sabedoria de Salomão',
    description: 'Acertou 500 perguntas no total acumulado do jogo.',
    metrics: (s) => [{ label: 'Acertos acumulados', current: s.correct, target: 500 }],
  },
  {
    id: 'faith_shield',
    level: 'Avançado',
    icon: 'shield-half',
    name: 'Escudo da Fé',
    description: 'Completou 100 quizzes no total.',
    metrics: (s) => [{ label: 'Partidas completadas', current: s.matches, target: 100 }],
  },
  {
    id: 'heavenly_guide',
    level: 'Avançado',
    icon: 'navigate',
    name: 'Guia Celestial',
    description: 'Alcançou 100% de acertos 5 vezes seguidas no modo avançado/difícil.',
    metrics: (s) => [{ label: 'Perfeitas seguidas (Hard)', current: s.streakPerfectHard, target: 5 }],
  },
  {
    id: 'desert_voice',
    level: 'Lendário',
    icon: 'megaphone',
    name: 'Voz no Deserto',
    description: 'Acertou 1.000 perguntas no total acumulado.',
    metrics: (s) => [{ label: 'Acertos acumulados', current: s.correct, target: 1000 }],
  },
  {
    id: 'temple_keeper',
    level: 'Lendário',
    icon: 'building',
    name: 'Zelador do Templo',
    description: 'Completou 250 quizzes no total.',
    metrics: (s) => [{ label: 'Partidas completadas', current: s.matches, target: 250 }],
  },
  {
    id: 'supreme_archangel',
    level: 'Lendário',
    icon: 'sparkles',
    name: 'Arcanjo Supremo',
    description: 'Alcançou a marca épica de 20 vezes com 100% de acertos no modo avançado.',
    metrics: (s) => [{ label: 'Perfeitas (Hard)', current: s.perfectHardCount, target: 20 }],
  },
  {
    id: 'valiant_cherubim',
    level: 'Lendário',
    icon: 'trophy',
    name: 'Querubim Valente',
    description: 'Completou 500 quizzes e acumulou mais de 2.000 acertos no total.',
    metrics: (s) => [
      { label: 'Partidas completadas', current: s.matches, target: 500 },
      { label: 'Acertos acumulados', current: s.correct, target: 2000 },
    ],
  },
  {
    id: 'wise_seraphim',
    level: 'Lendário',
    icon: 'star',
    name: 'Seraphim Sábio',
    description:
      'O ápice da jornada: 50 vezes com 100% de acertos no modo avançado e 1.000 quizzes concluídos.',
    metrics: (s) => [
      { label: 'Perfeitas (Hard)', current: s.perfectHardCount, target: 50 },
      { label: 'Partidas completadas', current: s.matches, target: 1000 },
    ],
  },
];

export function medalById(id) {
  return MEDALS.find((m) => m.id === id) || null;
}

export function medalColor(medal) {
  return LEVEL_COLORS[medal.level] || '#169B4E';
}

export function isMedalUnlocked(medal, stats) {
  return medal.metrics(stats).every((m) => m.current >= m.target);
}

export function medalPercent(medal, stats) {
  const metrics = medal.metrics(stats);
  const ratios = metrics.map((m) => (m.target > 0 ? Math.min(1, m.current / m.target) : 0));
  const value = ratios.length ? Math.min(...ratios) : 0;
  return Math.round(value * 100);
}

export async function loadAchievements() {
  try {
    const raw = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export async function saveAchievements(list) {
  try {
    await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    return false;
  }
}

export async function loadStats() {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return { ...EMPTY_STATS, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
  } catch (e) {
    return { ...EMPTY_STATS };
  }
}

async function saveStats(stats) {
  try {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
    return true;
  } catch (e) {
    return false;
  }
}

function todayKey() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

async function evaluateAndMerge(stats) {
  const list = await loadAchievements();
  const unlockedIds = new Set(list.map((a) => a.id));
  const fresh = MEDALS.filter((medal) => !unlockedIds.has(medal.id) && isMedalUnlocked(medal, stats));
  if (!fresh.length) return { achievements: list, newUnlocked: [] };
  const now = Date.now();
  const next = [...list, ...fresh.map((medal) => ({ id: medal.id, earnedAt: now }))];
  await saveAchievements(next);
  return { achievements: next, newUnlocked: fresh };
}

export async function recordQuizStarted() {
  const stats = await loadStats();
  if (!stats.started) {
    stats.started = true;
    stats.firstStartedAt = stats.firstStartedAt || Date.now();
    await saveStats(stats);
  }
  const res = await evaluateAndMerge(stats);
  return { ...res, stats };
}

export async function recordMatchResult({ correct = 0, total = 0, mode = 'tranquilo' } = {}) {
  const stats = await loadStats();
  const totalAnswered = Math.max(1, Math.round(total));
  const correctCount = Math.min(Math.max(0, Math.round(correct)), totalAnswered);
  const perfect = correctCount >= totalAnswered;

  stats.matches += 1;
  stats.correct += correctCount;

  if (perfect) {
    stats.perfectCount += 1;
    stats.streakPerfect += 1;
  } else {
    stats.streakPerfect = 0;
  }

  if (mode === 'intermediario') {
    if (perfect) {
      stats.perfectInterCount += 1;
      stats.streakPerfectInter += 1;
    } else {
      stats.streakPerfectInter = 0;
    }
  }

  if (mode === 'hard') {
    if (perfect) {
      stats.perfectHardCount += 1;
      stats.streakPerfectHard += 1;
    } else {
      stats.streakPerfectHard = 0;
    }
  }

  const day = todayKey();
  if (stats.lastPlayedDate !== day) {
    stats.lastPlayedDate = day;
    stats.playedDays += 1;
  }
  stats.lastMatchAt = Date.now();

  await saveStats(stats);
  const res = await evaluateAndMerge(stats);
  return { ...res, stats };
}