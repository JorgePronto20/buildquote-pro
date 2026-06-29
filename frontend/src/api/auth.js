import { apiFetch, jsonOptions } from './client'

export const authApi = {
  login: (payload) => apiFetch('/api/auth/login', jsonOptions('POST', payload)),
  register: (payload) => apiFetch('/api/auth/register', jsonOptions('POST', payload)),
  me: () => apiFetch('/api/auth/me'),
}
