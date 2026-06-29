const encoder = new TextEncoder();

function base64UrlEncode(bytesOrString) {
  const bytes = typeof bytesOrString === 'string' ? encoder.encode(bytesOrString) : bytesOrString;
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

function base64UrlDecodeToBytes(value) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function base64UrlDecodeJson(value) {
  const bytes = base64UrlDecodeToBytes(value);
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function signJwt(payload, secret, options = {}) {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = options.expiresIn || 60 * 60 * 24 * 7;
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = { ...payload, iat: now, exp: now + expiresIn };
  const headerPart = base64UrlEncode(JSON.stringify(header));
  const payloadPart = base64UrlEncode(JSON.stringify(body));
  const data = `${headerPart}.${payloadPart}`;
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(data));
  return `${data}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function verifyJwt(token, secret) {
  if (!token || token.split('.').length !== 3) throw new Error('JWT_INVALID');
  const [headerPart, payloadPart, signaturePart] = token.split('.');
  const header = base64UrlDecodeJson(headerPart);
  if (header.alg !== 'HS256') throw new Error('JWT_ALG_INVALID');
  const data = `${headerPart}.${payloadPart}`;
  const signature = base64UrlDecodeToBytes(signaturePart);
  const valid = await crypto.subtle.verify('HMAC', await hmacKey(secret), signature, encoder.encode(data));
  if (!valid) throw new Error('JWT_SIGNATURE_INVALID');
  const payload = base64UrlDecodeJson(payloadPart);
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) throw new Error('JWT_EXPIRED');
  return payload;
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, key, 256);
  return `pbkdf2_sha256$120000$${base64UrlEncode(salt)}$${base64UrlEncode(new Uint8Array(bits))}`;
}

export async function verifyPassword(password, storedHash) {
  const [algorithm, iterationsRaw, saltRaw, hashRaw] = String(storedHash || '').split('$');
  if (algorithm !== 'pbkdf2_sha256' || !iterationsRaw || !saltRaw || !hashRaw) return false;
  const salt = base64UrlDecodeToBytes(saltRaw);
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: Number(iterationsRaw), hash: 'SHA-256' }, key, 256);
  const expected = base64UrlDecodeToBytes(hashRaw);
  const actual = new Uint8Array(bits);
  if (expected.length !== actual.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) diff |= expected[i] ^ actual[i];
  return diff === 0;
}
