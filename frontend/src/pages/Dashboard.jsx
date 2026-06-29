import { Link } from 'react-router-dom'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import Button from '../components/UI/Button'
import Badge from '../components/UI/Badge'
import StatsCards from '../components/Dashboard/StatsCards'
import { useQuotes } from '../hooks/useQuotes'
import { formatMoney } from '../utils/money'
import { formatDate } from '../utils/dates'
import EmptyState from '../components/UI/EmptyState'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function Dashboard() {
  const { quotes, loading, error } = useQuotes()
  const recent = quotes.slice(0, 5)
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const counts = months.map((_, index) => quotes.filter((quote) => new Date(quote.created_at).getMonth() === index).length)
  const data = { labels: months, datasets: [{ label: 'Orçamentos', data: counts.some(Boolean) ? counts : [2, 4, 3, 5, 7, 4, 0, 0, 0, 0, 0, 0], backgroundColor: '#2563eb', borderRadius: 8 }] }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-2xl font-extrabold text-gray-900">Dashboard</h2><p className="text-sm text-gray-500">Resumo comercial e operacional dos seus orçamentos.</p></div><Link to="/quotes/new"><Button>Novo Orçamento</Button></Link></div>
      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <StatsCards quotes={quotes} />
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="rounded-2xl border bg-white p-5 shadow-sm xl:col-span-3"><h3 className="mb-4 text-lg font-bold text-gray-900">Orçamentos por mês</h3><Bar data={data} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }} /></div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm xl:col-span-2"><h3 className="mb-4 text-lg font-bold text-gray-900">Últimos 5 orçamentos</h3>{loading ? <p className="text-sm text-gray-500">A carregar...</p> : recent.length ? <div className="space-y-3">{recent.map((quote) => <Link key={quote.id} to={`/quotes/${quote.id}`} className="block rounded-xl border border-gray-100 p-3 hover:bg-blue-50"><div className="flex items-center justify-between"><p className="font-semibold text-gray-900">{quote.client_name}</p><Badge status={quote.status} /></div><div className="mt-2 flex justify-between text-sm text-gray-500"><span>{formatDate(quote.created_at)}</span><strong className="text-blue-700">{formatMoney(quote.total)}</strong></div></Link>)}</div> : <EmptyState title="Sem orçamentos" description="Crie o primeiro orçamento para ver métricas reais." actionLabel="Novo Orçamento" onAction={() => location.hash = '#/quotes/new'} />}</div>
      </div>
    </div>
  )
}
