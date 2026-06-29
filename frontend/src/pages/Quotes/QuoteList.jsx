import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/UI/Button'
import Badge from '../../components/UI/Badge'
import Select from '../../components/UI/Select'
import Input from '../../components/UI/Input'
import EmptyState from '../../components/UI/EmptyState'
import { quotesApi } from '../../api/quotes'
import { useQuotes } from '../../hooks/useQuotes'
import { QUOTE_STATUSES, professionLabel } from '../../utils/constants'
import { formatDate } from '../../utils/dates'
import { formatMoney } from '../../utils/money'

export default function QuoteList() {
  const [filters, setFilters] = useState({ status: '', month: '', client: '' })
  const params = useMemo(() => {
    const p = { status: filters.status, client: filters.client }
    if (filters.month) { p.date_from = `${filters.month}-01`; p.date_to = `${filters.month}-31` }
    return p
  }, [filters])
  const { quotes, loading, error, reload } = useQuotes(params)
  async function action(type, id) {
    try {
      if (type === 'duplicate') await quotesApi.duplicate(id)
      if (type === 'cancel') await quotesApi.cancel(id)
      if (type === 'send') await quotesApi.send(id)
      await reload()
    } catch (err) { alert(err.message) }
  }
  return <div className="space-y-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-2xl font-extrabold text-gray-900">Orçamentos</h2><p className="text-sm text-gray-500">Pesquise, filtre e acompanhe o estado de cada proposta.</p></div><Link to="/quotes/new"><Button>Novo Orçamento</Button></Link></div>
    <div className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-3"><Select label="Estado" value={filters.status} options={QUOTE_STATUSES} placeholder="Todos" onChange={(e) => setFilters({ ...filters, status: e.target.value })} /><Input label="Mês" type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} /><Input label="Cliente" placeholder="Pesquisar por cliente" value={filters.client} onChange={(e) => setFilters({ ...filters, client: e.target.value })} /></div>
    {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200 text-sm"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left">N.º</th><th className="px-4 py-3 text-left">Cliente</th><th className="px-4 py-3 text-left">Profissão</th><th className="px-4 py-3 text-left">Data</th><th className="px-4 py-3 text-left">Estado</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3 text-right">Ações</th></tr></thead><tbody className="divide-y divide-gray-100">{quotes.map((quote) => <tr key={quote.id} className="hover:bg-blue-50"><td className="px-4 py-3 font-semibold">{quote.quote_number}</td><td className="px-4 py-3">{quote.client_name}</td><td className="px-4 py-3">{professionLabel(quote.profession)}</td><td className="px-4 py-3">{formatDate(quote.created_at)}</td><td className="px-4 py-3"><Badge status={quote.status} /></td><td className="px-4 py-3 text-right font-bold">{formatMoney(quote.total)}</td><td className="px-4 py-3"><div className="flex justify-end gap-2"><Link to={`/quotes/${quote.id}`}><Button variant="secondary" className="px-3">Ver</Button></Link><Button variant="ghost" className="px-3" onClick={() => action('duplicate', quote.id)}>Duplicar</Button><Button variant="ghost" className="px-3" onClick={() => action('send', quote.id)}>Enviar</Button><Button variant="ghost" className="px-3 text-red-600" onClick={() => action('cancel', quote.id)}>Anular</Button></div></td></tr>)}</tbody></table>{!loading && !quotes.length && <div className="p-6"><EmptyState title="Nenhum orçamento encontrado" description="Ajuste os filtros ou crie um novo orçamento." /></div>}{loading && <p className="p-6 text-sm text-gray-500">A carregar orçamentos...</p>}</div></div>
  </div>
}
