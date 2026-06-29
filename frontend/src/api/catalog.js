import { apiFetch, jsonOptions } from './client'

function toQuery(params = {}) {
  return new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)).toString()
}

export const catalogApi = {
  brands: () => apiFetch('/api/brands'),
  series: (brandId) => apiFetch(`/api/brands/${brandId}/series`),
  materials: (params = {}) => {
    const query = toQuery(params)
    return apiFetch(`/api/catalog/materials${query ? `?${query}` : ''}`)
  },
  getMaterial: (id) => apiFetch(`/api/catalog/materials/${id}`),
  compatibility: (id) => apiFetch(`/api/catalog/materials/${id}/compatibility`),
  createMaterial: (payload) => apiFetch('/api/catalog/materials', jsonOptions('POST', payload)),
  updateMaterial: (id, payload) => apiFetch(`/api/catalog/materials/${id}`, jsonOptions('PUT', payload)),
}
