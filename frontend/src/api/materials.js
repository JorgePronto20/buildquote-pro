import { apiFetch, jsonOptions } from './client'

export const materialsApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value)).toString()
    return apiFetch(`/api/materials${query ? `?${query}` : ''}`)
  },
  create: (payload) => apiFetch('/api/materials', jsonOptions('POST', payload)),
  update: (id, payload) => apiFetch(`/api/materials/${id}`, jsonOptions('PUT', payload)),
  remove: (id) => apiFetch(`/api/materials/${id}`, { method: 'DELETE' }),
}
