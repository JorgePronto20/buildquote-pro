import { ok, notFound, fail } from './utils/responses.js';
import { isPublicRoute, requireAuth } from './middleware/auth.js';
import { handleAuthRoutes } from './modules/auth/routes.js';
import { handleProfessionalRoutes } from './modules/professionals/routes.js';
import { handleQuoteRoutes } from './modules/quotes/routes.js';
import { handleMaterialRoutes } from './modules/materials/routes.js';
import { handleProfessionEngineRoutes } from './modules/profession-engine/routes.js';

export async function routeRequest(request, env) {
  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);

  if (url.pathname === '/' || url.pathname === '/api/health') {
    return ok({ app: env.APP_NAME || 'BuildQuote Pro', env: env.APP_ENV || 'development', status: 'ok' });
  }

  if (segments[0] !== 'api') {
    return notFound('Endpoint não encontrado');
  }

  let user = null;
  if (!isPublicRoute(url.pathname)) {
    const auth = await requireAuth(request, env);
    if (auth.response) return auth.response;
    user = auth.user;
  }

  const ctx = { request, env, user, url, segments };

  try {
    const handlers = [
      handleAuthRoutes,
      handleProfessionalRoutes,
      handleQuoteRoutes,
      handleMaterialRoutes,
      handleProfessionEngineRoutes
    ];

    for (const handler of handlers) {
      const response = await handler(ctx);
      if (response) return response;
    }

    return notFound('Endpoint não encontrado');
  } catch (error) {
    console.error('Unhandled route error', error);
    return fail('INTERNAL_ERROR', 500, 'Erro interno do servidor');
  }
}
