import { verifyJwt } from '../utils/jwt.js';
import { unauthorized } from '../utils/responses.js';

export function isPublicRoute(pathname) {
  return pathname === '/api/health' ||
    pathname.startsWith('/api/auth/register') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/quotes/public/') ||
    pathname.startsWith('/api/brands') ||
    pathname.startsWith('/api/catalog');
}

export async function requireAuth(request, env) {
  const header = request.headers.get('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return { user: null, response: unauthorized('Token JWT em falta') };

  try {
    const payload = await verifyJwt(match[1], env.JWT_SECRET || 'CHANGE_ME_USE_WRANGLER_SECRET_IN_PRODUCTION');
    const user = await env.DB.prepare('SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?').bind(payload.sub).first();
    if (!user) return { user: null, response: unauthorized('Utilizador não encontrado') };
    return { user, response: null };
  } catch (_err) {
    return { user: null, response: unauthorized('Token JWT inválido ou expirado') };
  }
}
