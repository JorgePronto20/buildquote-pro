export function formatMoney(value = 0) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(Number(value || 0))
}

export function roundMoney(value = 0) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100
}

export function itemSubtotal(item) {
  return roundMoney(Number(item.quantity || 0) * Number(item.unit_price || item.unit_cost || 0))
}

export function itemTotal(item) {
  const subtotal = itemSubtotal(item)
  return roundMoney(subtotal * (1 + Number(item.vat_rate || 0) / 100))
}
