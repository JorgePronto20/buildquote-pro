import { bodyOrError, requireFields } from '../../middleware/validation.js';
import { ok, badRequest, notFound } from '../../utils/responses.js';
import { calculate as calculateElectrician } from './formulas/electrician.js';
import { calculate as calculatePainter } from './formulas/painter.js';
import { calculate as calculatePlumber } from './formulas/plumber.js';

const PROFESSIONS = [
  { code: 'electrician', name: 'Eletricista', description: 'Instalações elétricas, pontos, cabos, disjuntores e mecanismos.' },
  { code: 'painter', name: 'Pintor', description: 'Pintura interior/exterior, tintas, primários e consumíveis.' },
  { code: 'plumber', name: 'Canalizador', description: 'Tubagem, pontos de água, válvulas e acessórios.' }
];

const calculators = {
  electrician: calculateElectrician,
  painter: calculatePainter,
  plumber: calculatePlumber
};

export async function handleProfessionEngineRoutes({ request, env, segments }) {
  if (request.method === 'GET' && segments[1] === 'professions' && segments.length === 2) {
    return ok({ professions: PROFESSIONS });
  }

  if (request.method === 'GET' && segments[1] === 'professions' && segments[3] === 'rules') {
    const code = segments[2];
    const profession = PROFESSIONS.find((item) => item.code === code);
    if (!profession) return notFound('Profissão não encontrada');
    const rules = await env.DB.prepare('SELECT * FROM profession_rules WHERE profession = ? ORDER BY rule_key').bind(code).all();
    return ok({ profession, rules: rules.results || [] });
  }

  if (request.method === 'POST' && segments[1] === 'calculate') {
    const { body, error } = await bodyOrError(request);
    if (error) return error;
    const missing = requireFields(body, ['profession']);
    if (missing) return badRequest(missing);
    const calculator = calculators[body.profession];
    if (!calculator) return badRequest('Profissão sem motor de cálculo disponível');

    const zoneInputs = Array.isArray(body.zones) ? body.zones : null;
    if (zoneInputs) {
      const zones = zoneInputs.map((zone, index) => ({
        index,
        name: zone.name || `Zona ${index + 1}`,
        result: calculator(zone)
      }));
      return ok({ profession: body.profession, zones, items: zones.flatMap((zone) => zone.result.items) });
    }

    return ok({ result: calculator(body.inputs || body) });
  }

  return null;
}
