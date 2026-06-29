import { formatMoney } from '../../utils/money'

export default function StatsCards({ quotes = [] }) {
  const total = quotes.length
  const value = quotes.reduce((sum, quote) => sum + Number(quote.total || 0), 0)
  const approved = quotes.filter((quote) => ['accepted', 'approved'].includes(quote.status)).length
  const pending = quotes.filter((quote) => ['draft', 'sent'].includes(quote.status)).length
  const rate = total ? Math.round((approved / total) * 100) : 0

  const cards = [
    { label: 'Total de orçamentos', value: total, icon: '🧾' },
    { label: 'Valor total', value: formatMoney(value), icon: '💶' },
    { label: 'Taxa de aprovação', value: `${rate}%`, icon: '✅' },
    { label: 'Pendentes', value: pending, icon: '⏳' },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><p className="text-sm font-medium text-gray-500">{card.label}</p><span className="text-2xl">{card.icon}</span></div>
          <p className="mt-3 text-3xl font-extrabold text-gray-900">{card.value}</p>
        </div>
      ))}
    </div>
  )
}
