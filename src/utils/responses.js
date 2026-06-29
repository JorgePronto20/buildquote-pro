export function jsonResponse(payload = {}, status = 200, extraHeaders = {}) {
  const body = {
    success: payload.success ?? status < 400,
    data: payload.data ?? null,
    error: payload.error ?? null,
    message: payload.message ?? null
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders
    }
  });
}

export function ok(data = null, message = null, status = 200) {
  return jsonResponse({ success: true, data, message }, status);
}

export function created(data = null, message = 'Criado com sucesso') {
  return ok(data, message, 201);
}

export function fail(error = 'Erro interno', status = 500, message = null) {
  return jsonResponse({ success: false, error, message }, status);
}

export function notFound(message = 'Recurso não encontrado') {
  return fail('NOT_FOUND', 404, message);
}

export function badRequest(message = 'Pedido inválido') {
  return fail('BAD_REQUEST', 400, message);
}

export function unauthorized(message = 'Autenticação necessária') {
  return fail('UNAUTHORIZED', 401, message);
}

export function forbidden(message = 'Sem permissão') {
  return fail('FORBIDDEN', 403, message);
}
