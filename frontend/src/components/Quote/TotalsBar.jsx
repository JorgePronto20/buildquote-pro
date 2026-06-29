import { formatMoney, roundMoney } from '../../utils/money'

export function calculateTotals(items = [], discountPercent = 0, marginPercent = 0, forcedVat = null) {
  const base = items.reduce((sum, item) => {
    const price = Number(item.unit_price || item.unit_cost || 0)
    const margin = Number(item.margin_rate ?? marginPercent ?? 0)
    const unit = roundMoney(price * (1 + margin / 100))
    return sum + Number(item.quantity || 0) * unit
  }, 0)
  const discount = roundMoney(base * Number(discountPercent || 0) / 100)
  const afterDiscount = Math.max(base - discount, 0)
  const vat = forcedVat === null
    ? items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unit_price || item.unit_cost || 0) * Number(item.vat_rate || 0) / 100), 0)
    : roundMoney(afterDiscount * Number(forcedVat || 0) / 100)
  return { subtotal: roundMoney(base), discount, vat: roundMoney(vat), total: roundMoney(afterDiscount + vat) }
}

export default function TotalsBar({ items = [], discountPercent = 0, marginPercent = 0, vatRate = null }) {
  const totals = calculateTotals(items, discountPercent, marginPercent, vatRate)
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <div><p className="text-xs text-blue-700">Subtotal sem IVA</p><p className="font-bold text-gray-900">{formatMoney(totals.subtotal)}</p></div>
        <div><p className="text-xs text-blue-700">IVA</p><p className="font-bold text-gray-900">{formatMoney(totals.vat)}</p></div>
        <div><p className="text-xs text-blue-700">Desconto</p><p className="font-bold text-gray-900">{formatMoney(totals.discount)}</p></div>
        <div><p className="text-xs text-blue-700">Total final</p><p className="text-xl font-extrabold text-blue-700">{formatMoney(totals.total)}</p></div>
      </div>
    </div>
  )
}
