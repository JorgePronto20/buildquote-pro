import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { quotesApi } from '../../api/quotes'
import Button from '../../components/UI/Button'
import Badge from '../../components/UI/Badge'
import EmptyState from '../../components/UI/EmptyState'
import Input from '../../components/UI/Input'
import Modal from '../../components/UI/Modal'
import { formatMoney } from '../../utils/money'
import { formatDate } from '../../utils/dates'

export default function QuotePublic() {
  /* @section: public-quote-state */
  const { token } = useParams()
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [modal, setModal] = useState(null)
  const [clientForm, setClientForm] = useState({ client_name: '', client_email: '', notes: '' })
  const [resultMessage, setResultMessage] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await quotesApi.getPublic(token)
      setQuote(data.quote)
      setClientForm((current) => ({
        ...current,
        client_name: current.client_name || data.quote?.client_name || '',
        client_email: current.client_email || data.quote?.client_email || '',
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [token])

  async function submitDecision(action) {
    setBusy(true)
    try {
      const fn = action === 'accept' ? quotesApi.acceptPublic : quotesApi.rejectPublic
      const data = await fn(token, clientForm)
      setModal(null)
      setResultMessage(data?.message || (action === 'accept' ? 'Orçamento aceite com sucesso.' : 'Orçamento rejeitado.'))
      await load()
    } catch (err) {
      alert(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">A carregar orçamento...</div>
  if (error) return <div className="p-8"><EmptyState title="Orçamento indisponível" description={error} /></div>
  if (!quote) return null

  const locked = ['accepted', 'accepted_pending_professional', 'accepted_paid', 'approved', 'rejected', 'cancelled'].includes(quote.status)

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:bg-white">
      {/* @section: public-quote-document */}
      <main className="mx-auto max-w-5xl rounded-3xl bg-white p-6 shadow-xl print:shadow-none">
        <header className="flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">BuildQuote Pro</h1>
            <p className="text-gray-500">Proposta profissional de orçamento</p>
          </div>
          <div className="sm:text-right"><Badge status={quote.status} /><p className="mt-2 text-sm text-gray-500">N.º {quote.quote_number}</p><p className="text-sm text-gray-500">Validade: {formatDate(quote.valid_until)}</p></div>
        </header>

        {resultMessage && <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 print:hidden">{resultMessage}</div>}

        <section className="grid gap-5 py-6 md:grid-cols-2">
          <div><h2 className="font-bold">Dados da empresa</h2><p className="text-sm text-gray-500">Profissional BuildQuote Pro</p><p className="text-sm text-gray-500">Serviços de construção civil</p></div>
          <div><h2 className="font-bold">Cliente</h2><p>{quote.client_name}</p><p className="text-sm text-gray-500">{quote.client_email}</p><p className="text-sm text-gray-500">{quote.client_address}</p></div>
        </section>

        <div className="overflow-x-auto rounded-2xl border">
          <table className="min-w-full divide-y text-sm">
            <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left">Material / Serviço</th><th className="px-4 py-3 text-right">Qtd</th><th className="px-4 py-3 text-right">Preço</th><th className="px-4 py-3 text-right">IVA</th><th className="px-4 py-3 text-right">Total</th></tr></thead>
            <tbody className="divide-y">{quote.items?.map((item) => <tr key={item.id}><td className="px-4 py-3">{item.description}</td><td className="px-4 py-3 text-right">{item.quantity} {item.unit}</td><td className="px-4 py-3 text-right">{formatMoney(item.unit_price)}</td><td className="px-4 py-3 text-right">{item.vat_rate}%</td><td className="px-4 py-3 text-right font-bold">{formatMoney(item.total)}</td></tr>)}</tbody>
          </table>
        </div>

        <section className="ml-auto mt-6 max-w-sm rounded-2xl bg-blue-50 p-5"><div className="flex justify-between"><span>Subtotal</span><strong>{formatMoney(quote.subtotal)}</strong></div><div className="flex justify-between"><span>IVA</span><strong>{formatMoney(quote.vat_total)}</strong></div><div className="flex justify-between"><span>Desconto</span><strong>{formatMoney(quote.discount)}</strong></div><div className="mt-3 flex justify-between border-t pt-3 text-xl"><span className="font-bold">Total final</span><strong className="text-blue-700">{formatMoney(quote.total)}</strong></div></section>

        {/* @section: public-quote-actions */}
        <footer className="mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <p className="text-sm text-gray-500">Ao aceitar confirma a adjudicação do orçamento nos termos apresentados. Ao rejeitar pode deixar uma nota para o profissional.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => window.print()}>Imprimir / PDF</Button>
            <Button variant="danger" onClick={() => setModal('reject')} disabled={locked || busy}>Rejeitar</Button>
            <Button onClick={() => setModal('accept')} disabled={locked || busy}>{locked ? 'Decisão registada' : 'Aceitar Orçamento'}</Button>
          </div>
        </footer>
      </main>

      {/* @section: public-decision-modal */}
      <Modal open={Boolean(modal)} onClose={() => setModal(null)} title={modal === 'accept' ? 'Aceitar orçamento' : 'Rejeitar orçamento'} footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button><Button variant={modal === 'reject' ? 'danger' : 'primary'} onClick={() => submitDecision(modal)} disabled={busy}>{modal === 'accept' ? 'Confirmar aceitação' : 'Confirmar rejeição'}</Button></div>}>
        <div className="space-y-4">
          <Input label="Nome" value={clientForm.client_name} onChange={(e) => setClientForm({ ...clientForm, client_name: e.target.value })} />
          <Input label="Email" type="email" value={clientForm.client_email} onChange={(e) => setClientForm({ ...clientForm, client_email: e.target.value })} />
          <label className="block"><span className="mb-1 block text-sm font-medium text-gray-700">Notas</span><textarea className="min-h-28 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500" value={clientForm.notes} onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })} placeholder={modal === 'accept' ? 'Notas opcionais para o profissional' : 'Indique, se quiser, o motivo da rejeição'} /></label>
        </div>
      </Modal>
    </div>
  )
}
