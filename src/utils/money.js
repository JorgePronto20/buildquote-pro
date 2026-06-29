export function roundMoney(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

export function lineSubtotal(quantity, unitPrice) {
  return roundMoney(Number(quantity || 0) * Number(unitPrice || 0));
}

export function lineTotal(quantity, unitPrice, vatRate = 23) {
  const subtotal = lineSubtotal(quantity, unitPrice);
  return roundMoney(subtotal * (1 + Number(vatRate || 0) / 100));
}

export function applyMargin(unitCost, marginRate = 0) {
  return roundMoney(Number(unitCost || 0) * (1 + Number(marginRate || 0) / 100));
}

export function computeItemTotals(item) {
  const unitPrice = item.unit_price !== undefined ? Number(item.unit_price) : applyMargin(item.unit_cost, item.margin_rate);
  const subtotal = lineSubtotal(item.quantity ?? 1, unitPrice);
  const total = roundMoney(subtotal * (1 + Number(item.vat_rate ?? 23) / 100));
  return { unit_price: roundMoney(unitPrice), subtotal, total };
}
