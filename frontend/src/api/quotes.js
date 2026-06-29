import { apiFetch, jsonOptions } from './client'

export const quotesApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value)).toString()
    return apiFetch(`/api/quotes${query ? `?${query}` : ''}`)
  },
  get: (id) => apiFetch(`/api/quotes/${id}`),
  create: (payload) => apiFetch('/api/quotes', jsonOptions('POST', payload)),
  update: (id, payload) => apiFetch(`/api/quotes/${id}`, jsonOptions('PUT', payload)),
  remove: (id) => apiFetch(`/api/quotes/${id}`, { method: 'DELETE' }),
  duplicate: (id) => apiFetch(`/api/quotes/${id}/duplicate`, { method: 'POST' }),
  send: (id) => apiFetch(`/api/quotes/${id}/send`, { method: 'POST' }),
  approval: (id) => apiFetch(`/api/quotes/${id}/approval`),
  approve: (id, payload = {}) => apiFetch(`/api/quotes/${id}/approve`, jsonOptions('POST', payload)),
  cancel: (id) => apiFetch(`/api/quotes/${id}/cancel`, { method: 'POST' }),
  addZone: (id, payload) => apiFetch(`/api/quotes/${id}/zones`, jsonOptions('POST', payload)),
  updateZone: (id, zoneId, payload) => apiFetch(`/api/quotes/${id}/zones/${zoneId}`, jsonOptions('PUT', payload)),
  deleteZone: (id, zoneId) => apiFetch(`/api/quotes/${id}/zones/${zoneId}`, { method: 'DELETE' }),
  addItem: (id, payload) => apiFetch(`/api/quotes/${id}/items`, jsonOptions('POST', payload)),
  updateItem: (id, itemId, payload) => apiFetch(`/api/quotes/${id}/items/${itemId}`, jsonOptions('PUT', payload)),
  deleteItem: (id, itemId) => apiFetch(`/api/quotes/${id}/items/${itemId}`, { method: 'DELETE' }),
  getPublic: (token) => apiFetch(`/api/quotes/public/${token}`),
  acceptPublic: (token, payload = {}) => apiFetch(`/api/quotes/public/${token}/accept`, jsonOptions('POST', payload)),
  rejectPublic: (token, payload = {}) => apiFetch(`/api/quotes/public/${token}/reject`, jsonOptions('POST', payload)),
}
