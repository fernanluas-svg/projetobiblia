const MAX_TERM_LENGTH = 120;
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200D\uFEFF]/g;
const MULTI_SPACES = /[\s]+/g;
const ONLY_SYMBOLS = /^[^\p{L}\p{N}]+$/u;

export function toSafeString(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return String(value);
  } catch (e) {
    return '';
  }
}

export function normalizeText(value) {
  let str = toSafeString(value).toLowerCase();
  str = str.replace(CONTROL_CHARS, ' ').replace(MULTI_SPACES, ' ').trim();
  if (!str) return '';
  try {
    str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } catch (e) {
    // se normalize() não estiver disponível, mantém o texto como está
  }
  return str;
}

export function sanitizeSearchTerm(value) {
  const str = normalizeText(value);
  if (!str) return '';
  return str.slice(0, MAX_TERM_LENGTH);
}

export function isValidSearchTerm(value) {
  const str = sanitizeSearchTerm(value);
  return str.length > 0 && !ONLY_SYMBOLS.test(str);
}

export function escapeRegExp(str) {
  return toSafeString(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}