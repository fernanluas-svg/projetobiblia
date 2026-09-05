import {
  hasRedis,
  redisGet,
  redisIncr,
  redisIncrBy,
  redisHset,
  redisHgetall,
  redisZadd,
  redisZrevrangeWithScores,
} from '../utils/redisClient';

const RANKING_KEY = 'biblia:quiz:ranking';
const RANKING_VERSION = 'v1';

const STATS_MATCHES_KEY = 'biblia:quiz:stats:matches';
const STATS_CORRECT_KEY = 'biblia:quiz:stats:correct';
const STATS_QUESTIONS_KEY = 'biblia:quiz:stats:questions';
const STATS_LAST_KEY = 'biblia:quiz:stats:last';

const NAME_MAX = 20;

function sanitizePlayerName(name) {
  return String(name ?? '').trim().replace(/\s+/g, ' ').slice(0, NAME_MAX) || 'Anônimo';
}

function normalizeScore(score) {
  return Number.isFinite(score) ? Math.max(0, Math.round(score)) : 0;
}

export async function submitScore(name, score) {
  if (!hasRedis()) return { ok: false, reason: 'unavailable' };
  const member = `${RANKING_VERSION}:${sanitizePlayerName(name)}`;
  const added = await redisZadd(RANKING_KEY, normalizeScore(score), member);
  if (!added) return { ok: false, reason: 'unavailable' };
  return { ok: true };
}

export async function fetchRanking(limit = 10) {
  if (!hasRedis()) return { ok: false, entries: [] };
  const entries = await redisZrevrangeWithScores(RANKING_KEY, limit);
  return {
    ok: true,
    entries: entries.map((entry, index) => {
      const member = String(entry.member);
      const prefix = `${RANKING_VERSION}:`;
      const name = member.startsWith(prefix) ? member.slice(prefix.length) : member;
      return {
        rank: index + 1,
        name,
        score: Number(entry.score) || 0,
      };
    }),
  };
}

export async function recordMatch({ score = 0, correct = 0, total = 0, mode = 'tranquilo' } = {}) {
  if (!hasRedis()) return { ok: false, reason: 'unavailable' };
  const matchTotal = Math.max(0, Math.round(total));
  const matchCorrect = Math.min(Math.max(0, Math.round(correct)), matchTotal);
  const matches = await redisIncr(STATS_MATCHES_KEY);
  const questions = await redisIncrBy(STATS_QUESTIONS_KEY, matchTotal);
  const correctAnswers = await redisIncrBy(STATS_CORRECT_KEY, matchCorrect);
  await redisHset(STATS_LAST_KEY, 'match', String(matches));
  await redisHset(STATS_LAST_KEY, 'score', String(normalizeScore(score)));
  await redisHset(STATS_LAST_KEY, 'correct', String(matchCorrect));
  await redisHset(STATS_LAST_KEY, 'total', String(matchTotal));
  await redisHset(STATS_LAST_KEY, 'mode', String(mode));
  await redisHset(STATS_LAST_KEY, 'at', String(Date.now()));
  return { ok: true, matches, questions, correctAnswers };
}

export async function fetchMatchStats() {
  if (!hasRedis()) return { ok: false, stats: null };
  const [matchesRaw, questionsRaw, correctRaw, last] = await Promise.all([
    redisGet(STATS_MATCHES_KEY),
    redisGet(STATS_QUESTIONS_KEY),
    redisGet(STATS_CORRECT_KEY),
    redisHgetall(STATS_LAST_KEY),
  ]);
  const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  return {
    ok: true,
    stats: {
      matches: toNumber(matchesRaw),
      questions: toNumber(questionsRaw),
      correct: toNumber(correctRaw),
      last: {
        match: toNumber(last && last.match),
        score: toNumber(last && last.score),
        correct: toNumber(last && last.correct),
        total: toNumber(last && last.total),
        mode: last && last.mode ? String(last.mode) : '',
        at: last && last.at ? String(last.at) : '',
      },
    },
  };
}