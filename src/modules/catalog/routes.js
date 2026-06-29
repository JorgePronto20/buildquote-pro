import { bodyOrError } from '../../middleware/validation.js';
import { ok, created, badRequest, notFound } from '../../utils/responses.js';
import { createId, nowIso } from '../../utils/ids.js';

// ─── helpers ─────────────────────────────────────────────────────────────────

function buildMaterialsQuery(url) {
  const where = ['is_active = 1'];
  const binds = [];

  const brandId = url.searchParams.get('brand_id');
  if (brandId) { where.push('brand_id = ?'); binds.push(brandId); }

  const seriesId = url.searchParams.get('series_id');
  if (seriesId) { where.push('series_id = ?'); binds.push(seriesId); }

  const category = url.searchParams.get('category');
  if (category) { where.push('category = ?'); binds.push(category); }

  const q = url.searchParams.get('q');
  if (q) {
    where.push('(name LIKE ? OR code LIKE ? OR description LIKE ?)');
    binds.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  // filtro por profissão: mapeamento categoria → profissão
  const profession = url.searchParams.get('profession');
  if (profession) {
    const professionCategories = {
      electrician: ['aparelhagem', 'proteção', 'cabos', 'tubos', 'calhas', 'quadros', 'caixas', 'acessórios', 'fixação'],
      painter: ['tintas', 'primários', 'vernizes', 'acessórios-pintura'],
      plumber: ['tubagens', 'acessórios-canalização', 'valvulas', 'impermeabilizacao'],
      pladurista: ['pladur', 'perfis', 'parafusaria', 'massas'],
      tiler: ['ceramica', 'cimentos-cola', 'rejuntes', 'impermeabilizacao'],
      mason: ['cimentos', 'inertes', 'impermeabilizacao', 'fixacao']
    };
    const cats = professionCategories[profession];
    if (cats && cats.length > 0) {
      const placeholders = cats.map(() => '?').join(', ');
      where.push(`category IN (${placeholders})`);
      binds.push(...cats);
    }
  }

  return { where, binds };
}

// ─── handler principal ────────────────────────────────────────────────────────

export async function handleCatalogRoutes(ctx) {
  const { request, env, user, segments, url } = ctx;

  // GET /api/brands
  if (request.method === 'GET' && segments[1] === 'brands' && segments.length === 2) {
    const result = await env.DB.prepare('SELECT * FROM brands ORDER BY name').all();
    return ok({ brands: result.results || [] });
  }

  // GET /api/brands/:id/series
  if (request.method === 'GET' && segments[1] === 'brands' && segments[3] === 'series' && segments.length === 4) {
    const brandId = segments[2];
    const brand = await env.DB.prepare('SELECT * FROM brands WHERE id = ?').bind(brandId).first();
    if (!brand) return notFound('Marca não encontrada');
    const result = await env.DB.prepare('SELECT * FROM series WHERE brand_id = ? AND is_active = 1 ORDER BY name').bind(brandId).all();
    return ok({ brand, series: result.results || [] });
  }

  if (segments[1] !== 'catalog') return null;

  // GET /api/catalog/materials — listagem com filtros
  if (request.method === 'GET' && segments[2] === 'materials' && segments.length === 3) {
    const { where, binds } = buildMaterialsQuery(url);
    const sql = `SELECT cm.*, b.name AS brand_name, b.slug AS brand_slug, s.name AS series_name
      FROM catalog_materials cm
      LEFT JOIN brands b ON b.id = cm.brand_id
      LEFT JOIN series s ON s.id = cm.series_id
      WHERE ${where.join(' AND ')}
      ORDER BY cm.category, cm.name`;
    const result = await env.DB.prepare(sql).bind(...binds).all();
    return ok({ materials: result.results || [] });
  }

  // GET /api/catalog/materials/:id — detalhe
  if (request.method === 'GET' && segments[2] === 'materials' && segments.length === 4) {
    const id = segments[3];
    const material = await env.DB.prepare(
      `SELECT cm.*, b.name AS brand_name, b.slug AS brand_slug, s.name AS series_name
       FROM catalog_materials cm
       LEFT JOIN brands b ON b.id = cm.brand_id
       LEFT JOIN series s ON s.id = cm.series_id
       WHERE cm.id = ?`
    ).bind(id).first();
    if (!material) return notFound('Material não encontrado');
    return ok({ material });
  }

  // GET /api/catalog/materials/:id/compatibility
  if (request.method === 'GET' && segments[2] === 'materials' && segments[4] === 'compatibility') {
    const id = segments[3];
    const material = await env.DB.prepare('SELECT id FROM catalog_materials WHERE id = ?').bind(id).first();
    if (!material) return notFound('Material não encontrado');
    const result = await env.DB.prepare(
      `SELECT mc.*, cm.code, cm.name, cm.category, cm.base_price, cm.unit
       FROM material_compatibility mc
       JOIN catalog_materials cm ON cm.id = mc.compatible_material_id
       WHERE mc.material_id = ?
       ORDER BY mc.compatibility_type, cm.name`
    ).bind(id).all();
    return ok({ compatible_materials: result.results || [] });
  }

  // POST /api/catalog/materials — criar (requer auth)
  if (request.method === 'POST' && segments[2] === 'materials' && segments.length === 3) {
    if (!user) return ok(null, 401);
    const { body, error } = await bodyOrError(request);
    if (error) return error;
    if (!body.code) return badRequest('Campo obrigatório: code');
    if (!body.name) return badRequest('Campo obrigatório: name');

    const existing = await env.DB.prepare('SELECT id FROM catalog_materials WHERE code = ?').bind(body.code).first();
    if (existing) return badRequest(`Código '${body.code}' já existe no catálogo`);

    const id = createId('cat');
    const now = nowIso();
    await env.DB.prepare(`
      INSERT INTO catalog_materials
        (id, series_id, brand_id, code, name, description, category, subcategory, unit, base_price, vat_rate, color, finish, image_url, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.series_id || null,
      body.brand_id || null,
      body.code,
      body.name,
      body.description || null,
      body.category || null,
      body.subcategory || null,
      body.unit || 'un',
      Number(body.base_price || 0),
      Number(body.vat_rate ?? 23),
      body.color || null,
      body.finish || null,
      body.image_url || null,
      body.is_active !== undefined ? Number(body.is_active) : 1,
      now,
      now
    ).run();

    const material = await env.DB.prepare('SELECT * FROM catalog_materials WHERE id = ?').bind(id).first();
    return created({ material }, 'Material adicionado ao catálogo');
  }

  // PUT /api/catalog/materials/:id — editar (requer auth)
  if (request.method === 'PUT' && segments[2] === 'materials' && segments.length === 4) {
    if (!user) return ok(null, 401);
    const id = segments[3];
    const existing = await env.DB.prepare('SELECT * FROM catalog_materials WHERE id = ?').bind(id).first();
    if (!existing) return notFound('Material não encontrado');

    const { body, error } = await bodyOrError(request);
    if (error) return error;

    const now = nowIso();
    await env.DB.prepare(`
      UPDATE catalog_materials SET
        series_id = ?, brand_id = ?, code = ?, name = ?, description = ?, category = ?, subcategory = ?,
        unit = ?, base_price = ?, vat_rate = ?, color = ?, finish = ?, image_url = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.series_id !== undefined ? body.series_id : existing.series_id,
      body.brand_id !== undefined ? body.brand_id : existing.brand_id,
      body.code || existing.code,
      body.name || existing.name,
      body.description !== undefined ? body.description : existing.description,
      body.category !== undefined ? body.category : existing.category,
      body.subcategory !== undefined ? body.subcategory : existing.subcategory,
      body.unit || existing.unit,
      body.base_price !== undefined ? Number(body.base_price) : existing.base_price,
      body.vat_rate !== undefined ? Number(body.vat_rate) : existing.vat_rate,
      body.color !== undefined ? body.color : existing.color,
      body.finish !== undefined ? body.finish : existing.finish,
      body.image_url !== undefined ? body.image_url : existing.image_url,
      body.is_active !== undefined ? Number(body.is_active) : existing.is_active,
      now,
      id
    ).run();

    const material = await env.DB.prepare('SELECT * FROM catalog_materials WHERE id = ?').bind(id).first();
    return ok({ material }, 'Material atualizado com sucesso');
  }

  return null;
}
