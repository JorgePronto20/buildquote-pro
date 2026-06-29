import { Link } from 'react-router-dom'
import Badge from '../UI/Badge'
import Button from '../UI/Button'
import { formatMoney } from '../../utils/money'
import { formatDate } from '../../utils/dates'
import { professionLabel } from '../../utils/constants'

export default function QuoteCard({ quote }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-sm font-bold text-gray-900">{quote.quote_number || quote.id}</p><p className="text-sm text-gray-500">{quote.client_name}</p></div>
        <Badge status={quote.status} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <span className="text-gray-500">Profissão</span><span className="text-right font-medium">{professionLabel(quote.profession)}</span>
        <span className="text-gray-500">Data</span><span className="text-right font-medium">{formatDate(quote.created_at)}</span>
        <span className="text-gray-500">Total</span><span className="text-right font-bold text-blue-700">{formatMoney(quote.total)}</span>
      </div>
      <Link to={`/quotes/${quote.id}`}><Button variant="secondary" className="mt-4 w-full">Ver orçamento</Button></Link>
    </div>
  )
}
