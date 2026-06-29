const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787'

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('bq_token')
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    data = {}
  }

  if (!res.ok) throw new Error(data.message || data.error || 'Erro na API')
  return data.data ?? data
}

export function jsonOptions(method, body) {
  return { method, body: JSON.stringify(body) }
}
