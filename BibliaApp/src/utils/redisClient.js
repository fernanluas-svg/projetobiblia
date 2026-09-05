const TIMEOUT_MS = 6000;

const REST_URL =
  process.env.EXPO_PUBLIC_UPSTASH_REDIS_REST_URL ||
  process.env.KV_REST_API_URL ||
  '';
const REST_TOKEN =
  process.env.EXPO_PUBLIC_UPSTASH_REDIS_REST_TOKEN ||
  process.env.KV_REST_API_TOKEN ||
  '';

export const isRedisConfigured = Boolean(REST_URL && REST_TOKEN);

export function hasRedis() {
  return isRedisConfigured;
}

async function execute(command) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(REST_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      signal: controller.signal,
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const data = await res.json();
    return data && Object.prototype.hasOwnProperty.call(data, 'result')
      ? { result: data.result }
      : { error: 'resposta invalida' };
  } catch (e) {
    return { error: e.message };
  } finally {
    clearTimeout(timer);
  }
}

export async function redisGet(key) {
  if (!hasRedis()) return null;
  const res = await execute(['GET', key]);
  if (res.error || res.result === null || res.result === undefined) return null;
  return String(res.result);
}

export async function redisSet(key, value) {
  if (!hasRedis()) return false;
  const res = await execute(['SET', key, String(value)]);
  return !res.error;
}

export async function redisIncr(key) {
  if (!hasRedis()) return null;
  const res = await execute(['INCR', key]);
  if (res.error) return null;
  return typeof res.result === 'number' ? res.result : null;
}

export async function redisIncrBy(key, amount) {
  if (!hasRedis()) return null;
  const res = await execute(['INCRBY', key, Number(amount) || 0]);
  if (res.error) return null;
  return typeof res.result === 'number' ? res.result : null;
}

export async function redisHset(key, field, value) {
  if (!hasRedis()) return false;
  const res = await execute(['HSET', key, String(field), String(value)]);
  return !res.error;
}

export async function redisHgetall(key) {
  if (!hasRedis()) return null;
  const res = await execute(['HGETALL', key]);
  if (res.error || res.result === null || res.result === undefined) return null;
  const raw = res.result;
  if (Array.isArray(raw)) {
    const out = {};
    for (let i = 0; i + 1 < raw.length; i += 2) {
      out[String(raw[i])] = String(raw[i + 1]);
    }
    return out;
  }
  return typeof raw === 'object' ? raw : null;
}

export async function redisZadd(key, score, member) {
  if (!hasRedis()) return false;
  const res = await execute(['ZADD', key, Number(score) || 0, String(member)]);
  return !res.error;
}

export async function redisZrevrangeWithScores(key, limit = 10) {
  if (!hasRedis()) return [];
  const res = await execute(['ZRANGE', key, 0, limit - 1, 'REV', 'WITHSCORES']);
  if (res.error || !Array.isArray(res.result)) return [];
  const flat = res.result;
  const entries = [];
  for (let i = 0; i + 1 < flat.length; i += 2) {
    entries.push({
      member: String(flat[i]),
      score: Number(flat[i + 1]) || 0,
    });
  }
  return entries;
}