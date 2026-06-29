import { bodyOrError } from '../../middleware/validation.js';
import { ok, notFound } from '../../utils/responses.js';
import { nowIso } from '../../utils/ids.js';

const PROFILE_FIELDS = ['business_name', 'nif', 'profession', 'phone', 'email', 'address', 'service_area', 'logo_url'];

export async function getProfessionalByUser(env, userId) {
  return env.DB.prepare('SELECT * FROM professionals WHERE user_id = ?').bind(userId).first();
}

export async function handleProfessionalRoutes({ request, env, user, segments }) {
  if (segments[1] !== 'professional' || segments[2] !== 'me') return null;

  if (request.method === 'GET') {
    const professional = await getProfessionalByUser(env, user.id);
    if (!professional) return notFound('Perfil profissional não encontrado');
    const modules = await env.DB.prepare('SELECT module_code, is_enabled, created_at FROM professional_modules WHERE professional_id = ?')
      .bind(professional.id).all();
    return ok({ professional, modules: modules.results || [] });
  }

  if (request.method === 'PUT') {
    const { body, error } = await bodyOrError(request);
    if (error) return error;
    const professional = await getProfessionalByUser(env, user.id);
    if (!professional) return notFound('Perfil profissional não encontrado');

    const values = PROFILE_FIELDS.map((field) => body[field] ?? professional[field] ?? null);
    const updatedAt = nowIso();
    await env.DB.prepare(`UPDATE professionals SET ${PROFILE_FIELDS.map((field) => `${field} = ?`).join(', ')}, updated_at = ? WHERE id = ?`)
      .bind(...values, updatedAt, professional.id).run();
    const updated = await env.DB.prepare('SELECT * FROM professionals WHERE id = ?').bind(professional.id).first();
    return ok({ professional: updated }, 'Perfil atualizado com sucesso');
  }

  return null;
}
