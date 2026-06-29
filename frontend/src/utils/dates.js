export function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short' }).format(new Date(value))
}

export function formatDateTime(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

export function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

export function addDaysInput(days = 30) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}
