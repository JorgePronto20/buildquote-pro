import { bodyOrError, requireFields } from '../../middleware/validation.js';
import { created, ok, badRequest, unauthorized, fail } from '../../utils/responses.js';
import { createId, nowIso } from '../../utils/ids.js';
import { hashPassword, verifyPassword, signJwt } from '../../utils/jwt.js';

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at, updated_at: user.updated_at };
}

async function issueToken(user, env) {
  return signJwt({ sub: user.id, email: user.email, role: user.role }, env.JWT_SECRET || 'CHANGE_ME_USE_WRANGLER_SECRET_IN_PRODUCTION');
}

export async function handleAuthRoutes({ request, env, user, segments }) {
  const action = segments[2];

  if (request.method === 'POST' && action === 'register') {
    try {
      const { body, error } = await bodyOrError(request);
      if (error) return error;

      const missing = requireFields(body, ['name', 'email', 'password']);
      if (missing) return badRequest(missing);

      const email = String(body.email).trim().toLowerCase();

      const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
      if (existing) return badRequest('Já existe um utilizador com este e-mail');

      const timestamp = nowIso();
      const newUser = {
        id: createId('usr'),
        name: String(body.name).trim(),
        email,
        password_hash: await hashPassword(String(body.password)),
        role: body.role || 'professional',
        created_at: timestamp,
        updated_at: timestamp
      };

      await env.DB.prepare(
        'INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(newUser.id, newUser.name, newUser.email, newUser.password_hash, newUser.role, newUser.created_at, newUser.updated_at).run();

      const professionalId = createId('pro');
      await env.DB.prepare(
        'INSERT INTO professionals (id, user_id, business_name, profession, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(professionalId, newUser.id, body.business_name || newUser.name, body.profession || null, newUser.email, timestamp, timestamp).run();

      const modulesResult = await env.DB.prepare('SELECT code FROM modules WHERE is_core = 1 OR is_active = 1').all();
      for (const mod of (modulesResult.results || [])) {
        await env.DB.prepare(
          'INSERT OR IGNORE INTO professional_modules (id, professional_id, module_code, is_enabled, created_at) VALUES (?, ?, ?, 1, ?)'
        ).bind(createId('pm'), professionalId, mod.code, timestamp).run();
      }

      const token = await issueToken(newUser, env);
      return created({ user: publicUser(newUser), professional_id: professionalId, token }, 'Registo efetuado com sucesso');

    } catch (err) {
      console.error('REGISTER_ERROR:', err && err.message, err && err.stack);
      return fail('REGISTER_ERROR', 500, err && err.message ? String(err.message) : 'Erro desconhecido no registo');
    }
  }

  if (request.method === 'POST' && action === 'login') {
    try {
      const { body, error } = await bodyOrError(request);
      if (error) return error;

      const missing = requireFields(body, ['email', 'password']);
      if (missing) return badRequest(missing);

      const email = String(body.email).trim().toLowerCase();
      const dbUser = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
      if (!dbUser || !(await verifyPassword(String(body.password), dbUser.password_hash))) {
        return unauthorized('Credenciais inválidas');
      }

      const token = await issueToken(dbUser, env);
      return ok({ user: publicUser(dbUser), token }, 'Login efetuado com sucesso');

    } catch (err) {
      console.error('LOGIN_ERROR:', err && err.message);
      return fail('LOGIN_ERROR', 500, err && err.message ? String(err.message) : 'Erro desconhecido no login');
    }
  }

  if (request.method === 'GET' && action === 'me') {
    return ok({ user });
  }

  return null;
}
