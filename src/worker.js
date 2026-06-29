import { routeRequest } from './router.js';
import { handleOptions, withCors } from './middleware/cors.js';
import { fail } from './utils/responses.js';

export default {
  async fetch(request, env, ctx) {
    const options = handleOptions(request, env);
    if (options) return options;

    try {
      const response = await routeRequest(request, env, ctx);
      return withCors(response, env);
    } catch (error) {
      console.error('Worker error', error);
      return withCors(fail('INTERNAL_ERROR', 500, 'Erro inesperado'), env);
    }
  }
};
