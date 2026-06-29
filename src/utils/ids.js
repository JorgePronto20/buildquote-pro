export function createId(prefix = '') {
  const id = crypto.randomUUID();
  return prefix ? `${prefix}_${id}` : id;
}

export function nowIso() {
  return new Date().toISOString();
}

export function quoteNumber() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const rand = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `BQ-${y}${m}${d}-${rand}`;
}

export function publicToken() {
  return crypto.randomUUID().replaceAll('-', '');
}
