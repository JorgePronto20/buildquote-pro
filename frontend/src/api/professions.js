import { apiFetch, jsonOptions } from './client'

export const professionsApi = {
  list: () => apiFetch('/api/professions'),
  rules: (profession) => apiFetch(`/api/professions/${profession}/rules`),
  calculate: (payload) => apiFetch('/api/calculate', jsonOptions('POST', payload)),
  getProfessional: () => apiFetch('/api/professional/me'),
  updateProfessional: (payload) => apiFetch('/api/professional/me', jsonOptions('PUT', payload)),
}
