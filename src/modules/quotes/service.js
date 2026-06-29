import { createId, nowIso, publicToken, quoteNumber } from '../../utils/ids.js';
import { computeItemTotals, roundMoney } from '../../utils/money.js';

export async function getProfessionalForUser(env, userId) {
  return env.DB.prepare('SELECT * FROM professionals WHERE user_id = ?').bind(userId).first();
}

export async function assertQuoteOwnership(env, quoteId, professionalId) {
  return env.DB.prepare('SELECT * FROM quotes WHERE id = ? AND professional_id = ?').bind(quoteId, professionalId).first();
}

export async function getQuoteFull(env, quoteId, professionalId = null) {
  const quote = professionalId
    ? await env.DB.prepare('SELECT * FROM quotes WHERE id = ? AND professional_id = ?').bind(quoteId, professionalId).first()
    : await env.DB.prepare('SELECT * FROM quotes WHERE id = ?').bind(quoteId).first();
  if (!quote) return null;
  const zones = await env.DB.prepare('SELECT * FROM quote_zones WHERE quote_id = ? ORDER BY sort_order, created_at').bind(quote.id).all();
  const items = await env.DB.prepare('SELECT * FROM quote_items WHERE quote_id = ? ORDER BY sort_order, created_at').bind(quote.id).all();
  const history = await env.DB.prepare('SELECT * FROM quote_status_history WHERE quote_id = ? ORDER BY created_at DESC').bind(quote.id).all();
  return { ...quote, zones: zones.results || [], items: items.results || [], status_history: history.results || [] };
}

export async function recalculateQuoteTotals(env, quoteId) {
  const itemsResult = await env.DB.prepare('SELECT subtotal, total FROM quote_items WHERE quote_id = ?').bind(quoteId).all();
  const items = itemsResult.results || [];
  const subtotal = roundMoney(items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0));
  const grossTotal = roundMoney(items.reduce((sum, item) => sum + Number(item.total || 0), 0));
  const quote = await env.DB.prepare('SELECT discount FROM quotes WHERE id = ?').bind(quoteId).first();
  const discount = Number(quote?.discount || 0);
  const total = roundMoney(Math.max(grossTotal - discount, 0));
  const vatTotal = roundMoney(grossTotal - subtotal);
  await env.DB.prepare('UPDATE quotes SET subtotal = ?, vat_total = ?, total = ?, updated_at = ? WHERE id = ?')
    .bind(subtotal, vatTotal, total, nowIso(), quoteId).run();
  return { subtotal, vat_total: vatTotal, discount, total };
}

export async function createStatusHistory(env, quoteId, oldStatus, newStatus, userId, notes = null) {
  await env.DB.prepare('INSERT INTO quote_status_history (id, quote_id, old_status, new_status, changed_by, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(createId('qsh'), quoteId, oldStatus, newStatus, userId || null, notes, nowIso()).run();
}

export async function changeQuoteStatus(env, quote, newStatus, userId, notes = null, extra = {}) {
  const token = extra.public_token ?? quote.public_token ?? null;
  await env.DB.prepare('UPDATE quotes SET status = ?, public_token = ?, updated_at = ? WHERE id = ?')
    .bind(newStatus, token, nowIso(), quote.id).run();
  await createStatusHistory(env, quote.id, quote.status, newStatus, userId, notes);
}

export async function insertQuote(env, professionalId, body = {}) {
  const timestamp = nowIso();
  const id = createId('quo');
  await env.DB.prepare(`INSERT INTO quotes (
    id, professional_id, quote_number, client_name, client_email, client_phone, client_nif, client_address,
    profession, status, subtotal, vat_total, discount, margin_rate, total, notes, public_token, valid_until, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, 0, ?, ?, ?, ?, ?)`).bind(
    id,
    professionalId,
    body.quote_number || quoteNumber(),
    body.client_name,
    body.client_email || null,
    body.client_phone || null,
    body.client_nif || null,
    body.client_address || null,
    body.profession || null,
    body.status || 'draft',
    Number(body.discount || 0),
    Number(body.margin_rate || 0),
    body.notes || null,
    body.public_token || null,
    body.valid_until || null,
    timestamp,
    timestamp
  ).run();
  return id;
}

export async function insertItem(env, quoteId, body = {}) {
  const totals = computeItemTotals(body);
  const id = createId('qit');
  await env.DB.prepare(`INSERT INTO quote_items (
    id, quote_id, zone_id, item_type, code, description, quantity, unit, unit_cost, unit_price, margin_rate, vat_rate,
    subtotal, total, supplier_id, notes, sort_order, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
    id,
    quoteId,
    body.zone_id || null,
    body.item_type || 'material',
    body.code || null,
    body.description,
    Number(body.quantity ?? 1),
    body.unit || 'un',
    Number(body.unit_cost || 0),
    totals.unit_price,
    Number(body.margin_rate || 0),
    Number(body.vat_rate ?? 23),
    totals.subtotal,
    totals.total,
    body.supplier_id || null,
    body.notes || null,
    Number(body.sort_order || 0),
    nowIso()
  ).run();
  await recalculateQuoteTotals(env, quoteId);
  return id;
}

export async function duplicateQuote(env, quote, userId) {
  const timestamp = nowIso();
  const newId = createId('quo');
  await env.DB.prepare(`INSERT INTO quotes (
    id, professional_id, quote_number, client_name, client_email, client_phone, client_nif, client_address, profession,
    status, subtotal, vat_total, discount, margin_rate, total, notes, public_token, valid_until, created_at, updated_at
  ) SELECT ?, professional_id, ?, client_name, client_email, client_phone, client_nif, client_address, profession,
    'draft', subtotal, vat_total, discount, margin_rate, total, notes, NULL, valid_until, ?, ? FROM quotes WHERE id = ?`)
    .bind(newId, quoteNumber(), timestamp, timestamp, quote.id).run();

  const zones = await env.DB.prepare('SELECT * FROM quote_zones WHERE quote_id = ?').bind(quote.id).all();
  const zoneMap = new Map();
  for (const zone of zones.results || []) {
    const zoneId = createId('qzo');
    zoneMap.set(zone.id, zoneId);
    await env.DB.prepare('INSERT INTO quote_zones (id, quote_id, name, zone_type, area_m2, notes, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(zoneId, newId, zone.name, zone.zone_type, zone.area_m2, zone.notes, zone.sort_order, timestamp).run();
  }

  const items = await env.DB.prepare('SELECT * FROM quote_items WHERE quote_id = ?').bind(quote.id).all();
  for (const item of items.results || []) {
    await env.DB.prepare(`INSERT INTO quote_items (id, quote_id, zone_id, item_type, code, description, quantity, unit, unit_cost, unit_price, margin_rate, vat_rate, subtotal, total, supplier_id, notes, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      createId('qit'), newId, item.zone_id ? zoneMap.get(item.zone_id) || null : null, item.item_type, item.code, item.description,
      item.quantity, item.unit, item.unit_cost, item.unit_price, item.margin_rate, item.vat_rate, item.subtotal, item.total,
      item.supplier_id, item.notes, item.sort_order, timestamp
    ).run();
  }
  await createStatusHistory(env, newId, null, 'draft', userId, 'Orçamento duplicado');
  return newId;
}

export function ensurePublicToken(quote) {
  return quote.public_token || publicToken();
}
