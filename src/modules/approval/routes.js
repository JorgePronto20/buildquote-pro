import { bodyOrError } from '../../middleware/validation.js';
import { ok, notFound, forbidden, badRequest } from '../../utils/responses.js';
import { createId, nowIso, publicToken } from '../../utils/ids.js';
import { getProfessionalForUser, assertQuoteOwnership, getQuoteFull, changeQuoteStatus, createStatusHistory } from '../quotes/service.js';

// ─── helpers ─────────────────────────────────────────────────────────────────

async function getOrCreateApproval(env, quoteId) {
  const existing = await env.DB.prepare('SELECT * FROM quote_approvals WHERE quote_id = ?').bind(quoteId).first();
  if (existing) return existing;
  const id = createId('apv');
  const now = nowIso();
  await env.DB.prepare(
    'INSERT INTO quote_approvals (id, quote_id, approved_by_professional, approved_by_client, created_at, updated_at) VALUES (?, ?, 0, 0, ?, ?)'
  ).bind(id, quoteId, now, now).run();
  return env.DB.prepare('SELECT * FROM quote_approvals WHERE id = ?').bind(id).first();
}

async function getClientIp(request) {
  return request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For') ||
    request.headers.get('X-Real-IP') ||
    'unknown';
}

// ─── handler principal ────────────────────────────────────────────────────────

export async function handleApprovalRoutes(ctx) {
  const { request, env, user, segments, url } = ctx;

  if (segments[1] !== 'quotes') return null;

  // ── rotas públicas: /api/quotes/public/:token/accept|reject ──────────────
  if (segments[2] === 'public') {
    const token = segments[3];
    if (!token) return notFound('Token público em falta');

    // Apenas os sub-paths de aprovação (accept / reject) — o GET público
    // já é tratado pelo módulo de quotes existente.
    const action = segments[4];
    if (action !== 'accept' && action !== 'reject') return null;
    if (request.method !== 'POST') return null;

    const quote = await env.DB.prepare('SELECT * FROM quotes WHERE public_token = ?').bind(token).first();
    if (!quote) return notFound('Orçamento não encontrado');

    const { body } = await bodyOrError(request);
    const clientIp = await getClientIp(request);
    const now = nowIso();
    const approval = await getOrCreateApproval(env, quote.id);

    if (action === 'accept') {
      if (quote.status === 'cancelled') return badRequest('Orçamento cancelado — não pode ser aceite');
      if (approval.approved_by_client) return badRequest('Orçamento já foi aceite pelo cliente');

      await env.DB.prepare(
        'UPDATE quote_approvals SET approved_by_client = 1, client_name = ?, client_email = ?, client_ip = ?, client_notes = ?, approved_at = ?, updated_at = ? WHERE id = ?'
      ).bind(
        body?.client_name || null,
        body?.client_email || null,
        clientIp,
        body?.notes || null,
        now,
        now,
        approval.id
      ).run();

      // Muda status para 'accepted_pending_professional' aguarda aprovação do profissional
      await changeQuoteStatus(env, quote, 'accepted_pending_professional', null, 'Orçamento aceite pelo cliente via link público');

      return ok({ status: 'accepted_pending_professional' }, 'Orçamento aceite com sucesso. Aguarda aprovação do profissional.');
    }

    if (action === 'reject') {
      if (approval.rejected_at) return badRequest('Orçamento já foi rejeitado');

      await env.DB.prepare(
        'UPDATE quote_approvals SET approved_by_client = 0, client_ip = ?, client_notes = ?, rejected_at = ?, updated_at = ? WHERE id = ?'
      ).bind(clientIp, body?.notes || null, now, now, approval.id).run();

      await changeQuoteStatus(env, quote, 'rejected', null, 'Orçamento rejeitado pelo cliente via link público');

      return ok({ status: 'rejected' }, 'Orçamento rejeitado.');
    }
  }

  // ── rotas autenticadas de aprovação: requerem quoteId ──────────────────────
  const quoteId = segments[2];
  if (!quoteId || segments[2] === 'public') return null;

  const action = segments[3];
  if (action !== 'send' && action !== 'approval' && action !== 'approve') return null;

  // Garantir que user existe (auth já foi verificado no router, mas user pode ser null em rotas públicas)
  if (!user) return null;

  const professional = await getProfessionalForUser(env, user.id);
  if (!professional) return forbidden('Perfil profissional obrigatório');

  const quote = await assertQuoteOwnership(env, quoteId, professional.id);
  if (!quote) return notFound('Orçamento não encontrado');

  // POST /api/quotes/:id/send — gera public_token + cria registo de aprovação
  if (request.method === 'POST' && action === 'send') {
    // Gera token se ainda não existir
    const token = quote.public_token || publicToken();

    // Actualiza o token no orçamento (mesmo se já existia, mantém)
    if (!quote.public_token) {
      await env.DB.prepare('UPDATE quotes SET public_token = ?, updated_at = ? WHERE id = ?')
        .bind(token, nowIso(), quote.id).run();
    }

    // Cria ou recupera registo de aprovação
    await getOrCreateApproval(env, quote.id);

    // Muda status para 'sent'
    const refreshedQuote = await env.DB.prepare('SELECT * FROM quotes WHERE id = ?').bind(quote.id).first();
    await changeQuoteStatus(env, refreshedQuote, 'sent', user.id, 'Orçamento enviado ao cliente', { public_token: token });

    const approval = await env.DB.prepare('SELECT * FROM quote_approvals WHERE quote_id = ?').bind(quote.id).first();

    return ok({
      quote: await getQuoteFull(env, quote.id, professional.id),
      approval,
      public_url: `/api/quotes/public/${token}`
    }, 'Orçamento enviado ao cliente com sucesso');
  }

  // GET /api/quotes/:id/approval — estado da aprovação
  if (request.method === 'GET' && action === 'approval') {
    const approval = await env.DB.prepare('SELECT * FROM quote_approvals WHERE quote_id = ?').bind(quoteId).first();
    if (!approval) return notFound('Registo de aprovação não encontrado. O orçamento ainda não foi enviado.');
    return ok({ approval });
  }

  // POST /api/quotes/:id/approve — profissional aprova manualmente
  if (request.method === 'POST' && action === 'approve') {
    const { body } = await bodyOrError(request);
    const now = nowIso();
    const approval = await getOrCreateApproval(env, quote.id);

    await env.DB.prepare(
      'UPDATE quote_approvals SET approved_by_professional = 1, professional_notes = ?, approved_at = ?, updated_at = ? WHERE id = ?'
    ).bind(body?.notes || null, now, now, approval.id).run();

    // Aprovação manual do profissional → status 'accepted_paid' (confirma a obra)
    await changeQuoteStatus(env, quote, 'accepted_paid', user.id, 'Orçamento aprovado manualmente pelo profissional');

    const updatedApproval = await env.DB.prepare('SELECT * FROM quote_approvals WHERE id = ?').bind(approval.id).first();

    return ok({
      quote: await getQuoteFull(env, quote.id, professional.id),
      approval: updatedApproval
    }, 'Orçamento aprovado com sucesso');
  }

  return null;
}
