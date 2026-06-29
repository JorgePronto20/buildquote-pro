import { bodyOrError, requireFields } from '../../middleware/validation.js';
import { ok, created, badRequest, notFound } from '../../utils/responses.js';
import { createId, nowIso } from '../../utils/ids.js';

const MATERIAL_FIELDS = ['code', 'description', 'category', 'profession', 'unit', 'unit_cost', 'unit_price', 'vat_rate', 'supplier_id', 'supplier_name', 'brand', 'notes', 'is_active'];

export async function handleMaterialRoutes({ request, env, segments, url }) {
  if (segments[1] !== 'materials') return null;

  if (request.method === 'GET' && segments.length === 2) {
    const where = ['is_active = 1'];
    const binds = [];
    if (url.searchParams.get('profession')) { where.push('profession = ?'); binds.push(url.searchParams.get('profession')); }
    if (url.searchParams.get('category')) { where.push('category = ?'); binds.push(url.searchParams.get('category')); }
    if (url.searchParams.get('q')) {
      where.push('(description LIKE ? OR code LIKE ? OR brand LIKE ?)');
      const q = `%${url.searchParams.get('q')}%`;
      binds.push(q, q, q);
    }
    const result = await env.DB.prepare(`SELECT * FROM materials WHERE ${where.join(' AND ')} ORDER BY category, description`).bind(...binds).all();
    return ok({ materials: result.results || [] });
  }

  if (request.method === 'POST' && segments.length === 2) {
    const { body, error } = await bodyOrError(request);
    if (error) return error;
    const missing = requireFields(body, ['code', 'description']);
    if (missing) return badRequest(missing);
    const id = createId('mat');
    const timestamp = nowIso();
    await env.DB.prepare(`INSERT INTO materials (${['id', ...MATERIAL_FIELDS, 'created_at', 'updated_at'].join(', ')}) VALUES (${['?', ...MATERIAL_FIELDS.map(() => '?'), '?', '?'].join(', ')})`)
      .bind(id, ...MATERIAL_FIELDS.map((field) => body[field] ?? defaultFor(field)), timestamp, timestamp).run();
    const material = await env.DB.prepare('SELECT * FROM materials WHERE id = ?').bind(id).first();
    return created({ material }, 'Material criado');
  }

  const materialId = segments[2];
  const material = materialId ? await env.DB.prepare('SELECT * FROM materials WHERE id = ?').bind(materialId).first() : null;
  if (!material) return notFound('Material não encontrado');

  if (request.method === 'PUT') {
    const { body, error } = await bodyOrError(request);
    if (error) return error;
    const values = MATERIAL_FIELDS.map((field) => body[field] ?? material[field] ?? defaultFor(field));
    await env.DB.prepare(`UPDATE materials SET ${MATERIAL_FIELDS.map((field) => `${field} = ?`).join(', ')}, updated_at = ? WHERE id = ?`)
      .bind(...values, nowIso(), materialId).run();
    return ok({ material: await env.DB.prepare('SELECT * FROM materials WHERE id = ?').bind(materialId).first() }, 'Material atualizado');
  }

  if (request.method === 'DELETE') {
    await env.DB.prepare('UPDATE materials SET is_active = 0, updated_at = ? WHERE id = ?').bind(nowIso(), materialId).run();
    return ok({ id: materialId }, 'Material removido');
  }

  return null;
}

function defaultFor(field) {
  if (field === 'unit') return 'un';
  if (field === 'unit_cost' || field === 'unit_price') return 0;
  if (field === 'vat_rate') return 23;
  if (field === 'is_active') return 1;
  return null;
}
