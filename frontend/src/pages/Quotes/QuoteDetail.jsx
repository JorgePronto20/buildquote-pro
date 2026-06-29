import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { quotesApi } from '../../api/quotes'
import Button from '../../components/UI/Button'
import Badge from '../../components/UI/Badge'
import EmptyState from '../../components/UI/EmptyState'
import Input from '../../components/UI/Input'
import Modal from '../../components/UI/Modal'
import { formatMoney } from '../../utils/money'
import { formatDate, formatDateTime } from '../../utils/dates'
import { professionLabel } from '../../utils/constants'

function publicLinkFromQuote(quote) {
  if (!quote?.public_token) return ''
  if (typeof window === 'undefined') return `#/public/${quote.public_token}`
  return `${window.location.origin}${window.location.pathname}#/public/${quote.public_token}`
}

export default function QuoteDetail() {
  /* @section: quote-detail-state */
  const { id } = useParams()
  const navigate = useNavigate()
  const [quote, setQuote] = useState(null)
  const [approval, setApproval] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [approvalError, setApprovalError] = useState('')
  const [professionalNotes, setProfessionalNotes] = useState('')
  const [approveModal, setApproveModal] = useState(false)
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await quotesApi.get(id)
      setQuote(data.quote)
      try {
        const approvalData = await quotesApi.approval(id)
        setApproval(approvalData.approval)
        setApprovalError('')
      } catch (err) {
        setApproval(null)
        setApprovalError(err.message)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function runAction(fn, options = {}) {
    setBusy(true)
    try {
      const data = await fn()
      if (data?.quote) setQuote(data.quote)
      if (data?.approval) setApproval(data.approval)
      if (options.reload !== false) await load()
      return data
    } catch (err) {
      alert(err.message)
      return null
    } finally {
      setBusy(false)
    }
  }

  async function sendQuote() {
    const data = await runAction(() => quotesApi.send(id), { reload: true })
    const token = data?.quote?.public_token || quote?.public_token
    if (token && typeof window !== 'undefined') {
      const link = `${window.location.origin}${window.location.pathname}#/public/${token}`
      await navigator.clipboard?.writeText(link).catch(() => {})
      alert('Orçamento enviado/marcado como enviado. Link público copiado para a área de transferência.')
    }
  }

  async function approveQuote() {
    await runAction(() => quotesApi.approve(id, { notes: professionalNotes }), { reload: true })
    setApproveModal(false)
    setProfessionalNotes('')
  }

  function copyPublicLink() {
    const link = publicLinkFromQuote(quote)
    if (!link) return alert('Envie primeiro o orçamento ao cliente para gerar o link público.')
    navigator.clipboard?.writeText(link).then(() => alert('Link público copiado.')).catch(() => alert(link))
  }

  const publicLink = useMemo(() => publicLinkFromQuote(quote), [quote])

  if (loading) return <p className="text-sm text-gray-500">A carregar...</p>
  if (error) return <EmptyState title="Erro ao carregar orçamento" description={error} />
  if (!quote) return null

  const zones = quote.zones?.length ? quote.zones : [{ id: 'sem-zona', name: 'Itens sem zona' }]
  const clientAccepted = Boolean(approval?.approved_by_client) || quote.status === 'accepted_pending_professional'
  const professionalApproved = Boolean(approval?.approved_by_professional) || quote.status === 'accepted_paid' || quote.status === 'approved'

  return (
    <div className="mx-auto max-w-6xl space-y-5 print-page">
      {/* @section: quote-actions */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start print:hidden">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Orçamento {quote.quote_number}</h2>
          <p className="text-sm text-gray-500">{quote.client_name} · {professionLabel(quote.profession)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => window.print()}>Imprimir / PDF</Button>
          <Button variant="secondary" onClick={sendQuote} disabled={busy}>Enviar ao cliente</Button>
          <Button variant="secondary" onClick={copyPublicLink}>Copiar link</Button>
          <Button onClick={() => setApproveModal(true)} disabled={busy || professionalApproved}>Aprovar profissionalmente</Button>
          <Button variant="secondary" onClick={() => runAction(() => quotesApi.duplicate(id))} disabled={busy}>Duplicar</Button>
          <Button variant="danger" onClick={() => runAction(() => quotesApi.cancel(id))} disabled={busy}>Anular</Button>
        </div>
      </div>

      {/* @section: approval-panel */}
      <section className="grid gap-4 rounded-2xl border bg-white p-5 shadow-sm print:hidden md:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase text-gray-500">Estado atual</p>
          <div className="mt-2"><Badge status={quote.status} /></div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-gray-500">Cliente</p>
          <p className={`mt-2 font-bold ${clientAccepted ? 'text-emerald-700' : 'text-gray-700'}`}>{clientAccepted ? 'Aceite pelo cliente' : 'Ainda sem aceitação'}</p>
          {approval?.client_notes && <p className="mt-1 text-sm text-gray-500">Notas: {approval.client_notes}</p>}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-gray-500">Profissional</p>
          <p className={`mt-2 font-bold ${professionalApproved ? 'text-green-700' : 'text-gray-700'}`}>{professionalApproved ? 'Aprovado' : 'Pendente'}</p>
          {approvalError && <p className="mt-1 text-xs text-gray-400">{approvalError}</p>}
        </div>
        {publicLink && <div className="md:col-span-3"><Input label="Link público do cliente" value={publicLink} readOnly onFocus={(e) => e.target.select()} /></div>}
      </section>

      {/* @section: quote-print-document */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm print:shadow-none">
        <div className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row">
          <div><h1 className="text-3xl font-extrabold text-gray-900">BuildQuote Pro</h1><p className="text-sm text-gray-500">Orçamento profissional para construção civil</p></div>
          <div className="text-left sm:text-right"><Badge status={quote.status} /><p className="mt-2 text-sm text-gray-500">Criado em {formatDate(quote.created_at)}</p><p className="text-sm text-gray-500">Válido até {formatDate(quote.valid_until)}</p></div>
        </div>
        <div className="grid gap-4 py-5 md:grid-cols-2">
          <div><h3 className="font-bold text-gray-900">Cliente</h3><p>{quote.client_name}</p><p className="text-sm text-gray-500">{quote.client_email}</p><p className="text-sm text-gray-500">{quote.client_phone}</p><p className="text-sm text-gray-500">NIF: {quote.client_nif || '—'}</p><p className="text-sm text-gray-500">{quote.client_address}</p></div>
          <div><h3 className="font-bold text-gray-900">Dados gerais</h3><p className="text-sm text-gray-500">Profissão: {professionLabel(quote.profession)}</p><p className="text-sm text-gray-500">Notas: {quote.notes || '—'}</p></div>
        </div>
        {zones.map((zone) => {
          const items = quote.items?.filter((item) => item.zone_id === zone.id || zone.id === 'sem-zona') || []
          return <div key={zone.id} className="mb-6"><h3 className="mb-2 text-lg font-bold text-gray-900">{zone.name}</h3><div className="overflow-x-auto rounded-xl border"><table className="min-w-full divide-y text-sm"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left">Descrição</th><th className="px-4 py-3 text-right">Qtd</th><th className="px-4 py-3 text-right">Preço</th><th className="px-4 py-3 text-right">IVA</th><th className="px-4 py-3 text-right">Total</th></tr></thead><tbody className="divide-y">{items.map((item) => <tr key={item.id}><td className="px-4 py-3">{item.description}</td><td className="px-4 py-3 text-right">{item.quantity} {item.unit}</td><td className="px-4 py-3 text-right">{formatMoney(item.unit_price)}</td><td className="px-4 py-3 text-right">{item.vat_rate}%</td><td className="px-4 py-3 text-right font-bold">{formatMoney(item.total)}</td></tr>)}</tbody></table></div></div>
        })}
        <div className="ml-auto max-w-md rounded-2xl bg-blue-50 p-5"><div className="flex justify-between"><span>Subtotal</span><strong>{formatMoney(quote.subtotal)}</strong></div><div className="flex justify-between"><span>IVA</span><strong>{formatMoney(quote.vat_total)}</strong></div><div className="flex justify-between"><span>Desconto</span><strong>{formatMoney(quote.discount)}</strong></div><div className="mt-3 flex justify-between border-t pt-3 text-xl"><span className="font-bold">Total</span><strong className="text-blue-700">{formatMoney(quote.total)}</strong></div></div>
      </section>

      {/* @section: quote-status-history */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm print:hidden"><h3 className="font-bold text-gray-900">Histórico de estados</h3><div className="mt-3 space-y-2">{quote.status_history?.map((item) => <div key={item.id} className="rounded-lg bg-gray-50 p-3 text-sm"><Badge status={item.new_status} /> <span className="ml-2 text-gray-500">{formatDateTime(item.created_at)} — {item.notes}</span></div>)}</div></section>
      <Button variant="secondary" onClick={() => navigate('/quotes')} className="print:hidden">Voltar</Button>

      {/* @section: professional-approval-modal */}
      <Modal open={approveModal} onClose={() => setApproveModal(false)} title="Aprovação profissional" footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setApproveModal(false)}>Cancelar</Button><Button onClick={approveQuote} disabled={busy}>Confirmar aprovação</Button></div>}>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Confirma que este orçamento está aprovado pelo profissional e pode avançar para adjudicação/encomenda.</p>
          <Input label="Notas internas da aprovação" value={professionalNotes} onChange={(e) => setProfessionalNotes(e.target.value)} placeholder="Ex.: Cliente confirmou por telefone; avançar com preparação da obra." />
        </div>
      </Modal>
    </div>
  )
}
