import { hasRedis, redisZadd, redisZrevrangeWithScores } from './redisClient';

const RANKING_KEY = 'biblia:quiz:ranking';
const VERSION = 'v1';

function sanitizePlayerName(name) {
  return String(name ?? '').trim().replace(/\s+/g, ' ').slice(0, 20) || 'Anônimo';
}

export async function submitScore(name, score) {
  if (!hasRedis()) return { ok: false, reason: 'unavailable' };
  const points = Number.isFinite(score) ? Math.max(0, Math.round(score)) : 0;
  const member = `${VERSION}:${sanitizePlayerName(name)}`;
  const added = await redisZadd(RANKING_KEY, points, member);
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
      const prefix = `${VERSION}:`;
      const name = member.startsWith(prefix) ? member.slice(prefix.length) : member;
      return {
        rank: index + 1,
        name,
        score: Number(entry.score) || 0,
      };
    }),
  };
}