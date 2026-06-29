import { bodyOrError, requireFields } from '../../middleware/validation.js';
import { ok, created, badRequest, notFound, forbidden } from '../../utils/responses.js';
import { createId, nowIso } from '../../utils/ids.js';
import { computeItemTotals } from '../../utils/money.js';
import {
  getProfessionalForUser,
  assertQuoteOwnership,
  getQuoteFull,
  recalculateQuoteTotals,
  createStatusHistory,
  changeQuoteStatus,
  insertQuote,
  insertItem,
  duplicateQuote,
  ensurePublicToken
} from './service.js';

const QUOTE_FIELDS = ['client_name', 'client_email', 'client_phone', 'client_nif', 'client_address', 'profession', 'discount', 'margin_rate', 'notes', 'valid_until'];
const ZONE_FIELDS = ['name', 'zone_type', 'area_m2', 'notes', 'sort_order'];
const ITEM_FIELDS = ['zone_id', 'item_type', 'code', 'description', 'quantity', 'unit', 'unit_cost', 'unit_price', 'margin_rate', 'vat_rate', 'supplier_id', 'notes', 'sort_order'];

async function currentProfessional(env, user) {
  return getProfessionalForUser(env, user.id);
}

export async function handleQuoteRoutes(ctx) {
  const { request, env, user, segments, url } = ctx;
  if (segments[1] !== 'quotes') return null;

  if (segments[2] === 'public') return handlePublicQuoteRoutes(ctx);

  const professional = await currentProfessional(env, user);
  if (!professional) return forbidden('Perfil profissional obrigatório');

  if (request.method === 'GET' && segments.length === 2) {
    const where = ['professional_id = ?'];
    const binds = [professional.id];
    if (url.searchParams.get('status')) { where.push('status = ?'); binds.push(url.searchParams.get('status')); }
    if (url.searchParams.get('cliente')) { where.push('client_name LIKE ?'); binds.push(`%${url.searchParams.get('cliente')}%`); }
    if (url.searchParams.get('client')) { where.push('client_name LIKE ?'); binds.push(`%${url.searchParams.get('client')}%`); }
    if (url.searchParams.get('date_from')) { where.push('created_at >= ?'); binds.push(url.searchParams.get('date_from')); }
    if (url.searchParams.get('date_to')) { where.push('created_at <= ?'); binds.push(url.searchParams.get('date_to')); }
    const result = await env.DB.prepare(`SELECT * FROM quotes WHERE ${where.join(' AND ')} ORDER BY created_at DESC`).bind(...binds).all();
    return ok({ quotes: result.results || [] });
  }

  if (request.method === 'POST' && segments.length === 2) {
    const { body, error } = await bodyOrError(request);
    if (error) return error;
    const missing = requireFields(body, ['client_name']);
    if (missing) return badRequest(missing);
    const id = await insertQuote(env, professional.id, body);
    await createStatusHistory(env, id, null, body.status || 'draft', user.id, 'Orçamento criado');
    const quote = await getQuoteFull(env, id, professional.id);
    return created({ quote }, 'Orçamento criado com sucesso');
  }

  const quoteId = segments[2];
  if (!quoteId) return null;
  const quote = await assertQuoteOwnership(env, quoteId, professional.id);
  if (!quote) return notFound('Orçamento não encontrado');

  if (segments.length === 3 && request.method === 'GET') {
    return ok({ quote: await getQuoteFull(env, quoteId, professional.id) });
  }

  if (segments.length === 3 && request.method === 'PUT') {
    const { body, error } = await bodyOrError(request);
    if (error) return error;
    const values = QUOTE_FIELDS.map((field) => body[field] ?? quote[field] ?? null);
    await env.DB.prepare(`UPDATE quotes SET ${QUOTE_FIELDS.map((field) => `${field} = ?`).join(', ')}, updated_at = ? WHERE id = ?`)
      .bind(...values, nowIso(), quoteId).run();
    await recalculateQuoteTotals(env, quoteId);
    return ok({ quote: await getQuoteFull(env, quoteId, professional.id) }, 'Orçamento atualizado com sucesso');
  }

  if (segments.length === 3 && request.method === 'DELETE') {
    await changeQuoteStatus(env, quote, 'cancelled', user.id, 'Orçamento anulado por DELETE');
    return ok({ quote: await getQuoteFull(env, quoteId, professional.id) }, 'Orçamento anulado com sucesso');
  }

  if (request.method === 'POST' && segments[3] === 'duplicate') {
    const newId = await duplicateQuote(env, quote, user.id);
    return created({ quote: await getQuoteFull(env, newId, professional.id) }, 'Orçamento duplicado com sucesso');
  }

  if (request.method === 'POST' && segments[3] === 'send') {
    const token = ensurePublicToken(quote);
    await changeQuoteStatus(env, quote, 'sent', user.id, 'Orçamento enviado ao cliente', { public_token: token });
    return ok({ quote: await getQuoteFull(env, quoteId, professional.id), public_url: `/api/quotes/public/${token}` }, 'Orçamento marcado como enviado');
  }

  if (request.method === 'POST' && segments[3] === 'approve') {
    await changeQuoteStatus(env, quote, 'approved', user.id, 'Orçamento aprovado pelo profissional');
    return ok({ quote: await getQuoteFull(env, quoteId, professional.id) }, 'Orçamento aprovado');
  }

  if (request.method === 'POST' && segments[3] === 'cancel') {
    await changeQuoteStatus(env, quote, 'cancelled', user.id, 'Orçamento anulado');
    return ok({ quote: await getQuoteFull(env, quoteId, professional.id) }, 'Orçamento anulado');
  }

  if (segments[3] === 'zones') return handleZoneRoutes({ ...ctx, quote, professional });
  if (segments[3] === 'items') return handleItemRoutes({ ...ctx, quote, professional });

  return null;
}

async function handleZoneRoutes({ request, env, user, segments, quote, professional }) {
  const zoneId = segments[4];
  if (request.method === 'POST' && !zoneId) {
    const { body, error } = await bodyOrError(request);
    if (error) return error;
    const missing = requireFields(body, ['name']);
    if (missing) return badRequest(missing);
    const id = createId('qzo');
    await env.DB.prepare('INSERT INTO quote_zones (id, quote_id, name, zone_type, area_m2, notes, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, quote.id, body.name, body.zone_type || null, body.area_m2 ?? null, body.notes || null, Number(body.sort_order || 0), nowIso()).run();
    return created({ quote: await getQuoteFull(env, quote.id, professional.id) }, 'Zona adicionada');
  }

  const zone = zoneId ? await env.DB.prepare('SELECT * FROM quote_zones WHERE id = ? AND quote_id = ?').bind(zoneId, quote.id).first() : null;
  if (!zone) return notFound('Zona não encontrada');

  if (request.method === 'PUT') {
    const { body, error } = await bodyOrError(request);
    if (error) return error;
    const values = ZONE_FIELDS.map((field) => body[field] ?? zone[field] ?? null);
    await env.DB.prepare(`UPDATE quote_zones SET ${ZONE_FIELDS.map((field) => `${field} = ?`).join(', ')} WHERE id = ?`).bind(...values, zoneId).run();
    return ok({ quote: await getQuoteFull(env, quote.id, professional.id) }, 'Zona atualizada');
  }

  if (request.method === 'DELETE') {
    await env.DB.prepare('DELETE FROM quote_zones WHERE id = ?').bind(zoneId).run();
    await recalculateQuoteTotals(env, quote.id);
    return ok({ quote: await getQuoteFull(env, quote.id, professional.id) }, 'Zona removida');
  }

  return null;
}

async function handleItemRoutes({ request, env, segments, quote, professional }) {
  const itemId = segments[4];
  if (request.method === 'POST' && !itemId) {
    const { body, error } = await bodyOrError(request);
    if (error) return error;
    const missing = requireFields(body, ['description']);
    if (missing) return badRequest(missing);
    await insertItem(env, quote.id, body);
    return created({ quote: await getQuoteFull(env, quote.id, professional.id) }, 'Item adicionado');
  }

  const item = itemId ? await env.DB.prepare('SELECT * FROM quote_items WHERE id = ? AND quote_id = ?').bind(itemId, quote.id).first() : null;
  if (!item) return notFound('Item não encontrado');

  if (request.method === 'PUT') {
    const { body, error } = await bodyOrError(request);
    if (error) return error;
    const updated = { ...item, ...body };
    const totals = computeItemTotals(updated);
    const values = ITEM_FIELDS.map((field) => updated[field] ?? null);
    await env.DB.prepare(`UPDATE quote_items SET ${ITEM_FIELDS.map((field) => `${field} = ?`).join(', ')}, subtotal = ?, total = ? WHERE id = ?`)
      .bind(...values, totals.subtotal, totals.total, itemId).run();
    await recalculateQuoteTotals(env, quote.id);
    return ok({ quote: await getQuoteFull(env, quote.id, professional.id) }, 'Item atualizado');
  }

  if (request.method === 'DELETE') {
    await env.DB.prepare('DELETE FROM quote_items WHERE id = ?').bind(itemId).run();
    await recalculateQuoteTotals(env, quote.id);
    return ok({ quote: await getQuoteFull(env, quote.id, professional.id) }, 'Item removido');
  }

  return null;
}

async function handlePublicQuoteRoutes({ request, env, segments }) {
  const token = segments[3];
  if (!token) return notFound('Token público em falta');
  const quote = await env.DB.prepare('SELECT * FROM quotes WHERE public_token = ?').bind(token).first();
  if (!quote) return notFound('Orçamento público não encontrado');

  if (request.method === 'GET') {
    return ok({ quote: await getQuoteFull(env, quote.id) });
  }

  if (request.method === 'POST' && segments[4] === 'accept') {
    await changeQuoteStatus(env, quote, 'accepted', null, 'Orçamento aceite pelo cliente através de link público');
    return ok({ quote: await getQuoteFull(env, quote.id) }, 'Orçamento aceite com sucesso');
  }

  return null;
}
