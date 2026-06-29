import { badRequest } from '../utils/responses.js';

export async function readJson(request) {
  try {
    const text = await request.text();
    return text ? JSON.parse(text) : {};
  } catch (_err) {
    throw new Error('JSON_INVALID');
  }
}

export async function bodyOrError(request) {
  try {
    return { body: await readJson(request), error: null };
  } catch (_err) {
    return { body: null, error: badRequest('Corpo JSON inválido') };
  }
}

export function requireFields(body, fields = []) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
  if (missing.length) {
    return `Campos obrigatórios em falta: ${missing.join(', ')}`;
  }
  return null;
}

export function sanitizeString(value, fallback = '') {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
}
