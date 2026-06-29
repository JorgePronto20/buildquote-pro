import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { quotesApi } from '../../api/quotes'
import Button from '../UI/Button'
import Input from '../UI/Input'
import Select from '../UI/Select'
import ProfessionCalculator from '../Calculator/ProfessionCalculator'
import ZoneForm from './ZoneForm'
import ZoneList from './ZoneList'
import ItemForm from './ItemForm'
import ItemList from './ItemList'
import TotalsBar, { calculateTotals } from './TotalsBar'
import { addDaysInput, todayInput } from '../../utils/dates'
import { DEFAULT_VAT, PROFESSIONS, VAT_REGIMES } from '../../utils/constants'

const steps = ['Cliente e Dados Gerais', 'Cálculo Automático', 'Zonas e Itens', 'Margens e Resumo']

export default function QuoteForm() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [quote, setQuote] = useState({ profession: 'electrician', client_name: '', client_email: '', client_phone: '', client_nif: '', client_address: '', date: todayInput(), valid_until: addDaysInput(30), notes: '', margin_rate: 15, discount_percent: 0, vat_rate: DEFAULT_VAT })
  const [zones, setZones] = useState([{ local_id: 'zone-1', name: 'Sala', zone_type: 'Sala', area_m2: '', items: [] }])
  const [selectedZone, setSelectedZone] = useState('zone-1')

  const allItems = useMemo(() => zones.flatMap((zone) => zone.items.map((item) => ({ ...item, zone_local_id: zone.local_id }))), [zones])
  const totals = calculateTotals(allItems, quote.discount_percent, quote.margin_rate, quote.vat_rate)

  function addZone(zone) {
    const local_id = `zone-${Date.now()}`
    setZones([...zones, { ...zone, local_id, items: [] }])
    setSelectedZone(local_id)
  }
  function removeZone(zoneId) {
    const next = zones.filter((zone) => zone.local_id !== zoneId)
    setZones(next.length ? next : [{ local_id: `zone-${Date.now()}`, name: 'Zona 1', items: [] }])
    if (selectedZone === zoneId) setSelectedZone(next[0]?.local_id)
  }
  function addItemsToSelected(items) {
    setZones(zones.map((zone) => zone.local_id === selectedZone ? { ...zone, items: [...zone.items, ...items.map((item, index) => ({ ...item, local_id: item.local_id || `item-${Date.now()}-${index}` }))] } : zone))
  }
  function removeItem(itemId) {
    setZones(zones.map((zone) => zone.local_id === selectedZone ? { ...zone, items: zone.items.filter((item) => item.local_id !== itemId) } : zone))
  }

  async function save(status = 'draft') {
    if (!quote.client_name.trim()) { setError('Indique o nome do cliente antes de guardar.'); setStep(0); return }
    setSaving(true); setError('')
    try {
      const created = await quotesApi.create({
        client_name: quote.client_name,
        client_email: quote.client_email,
        client_phone: quote.client_phone,
        client_nif: quote.client_nif,
        client_address: quote.client_address,
        profession: quote.profession,
        status,
        discount: totals.discount,
        margin_rate: Number(quote.margin_rate || 0),
        notes: quote.notes,
        valid_until: quote.valid_until,
      })
      let full = created.quote
      for (const [zoneIndex, zone] of zones.entries()) {
        const zoneResult = await quotesApi.addZone(full.id, { name: zone.name, zone_type: zone.zone_type, area_m2: zone.area_m2, sort_order: zoneIndex })
        full = zoneResult.quote
        const createdZone = full.zones?.[full.zones.length - 1]
        for (const [itemIndex, item] of zone.items.entries()) {
          const itemResult = await quotesApi.addItem(full.id, { ...item, zone_id: createdZone?.id, sort_order: itemIndex, vat_rate: quote.vat_rate })
          full = itemResult.quote
        }
      }
      if (status === 'sent') await quotesApi.send(full.id)
      navigate(`/quotes/${full.id}`)
    } catch (err) {
      setError(err.message || 'Não foi possível guardar o orçamento')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {steps.map((label, index) => <button key={label} onClick={() => setStep(index)} className={`min-w-fit rounded-full px-4 py-2 text-sm font-semibold ${step === index ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{index + 1}. {label}</button>)}
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {step === 0 && <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">Cliente e Dados Gerais</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Select label="Profissão" value={quote.profession} options={PROFESSIONS} onChange={(e) => setQuote({ ...quote, profession: e.target.value })} />
          <Input label="Nome do cliente" value={quote.client_name} onChange={(e) => setQuote({ ...quote, client_name: e.target.value })} required />
          <Input label="Email" type="email" value={quote.client_email} onChange={(e) => setQuote({ ...quote, client_email: e.target.value })} />
          <Input label="Telefone" value={quote.client_phone} onChange={(e) => setQuote({ ...quote, client_phone: e.target.value })} />
          <Input label="NIF" value={quote.client_nif} onChange={(e) => setQuote({ ...quote, client_nif: e.target.value })} />
          <Input label="Morada" value={quote.client_address} onChange={(e) => setQuote({ ...quote, client_address: e.target.value })} />
          <Input label="Data" type="date" value={quote.date} onChange={(e) => setQuote({ ...quote, date: e.target.value })} />
          <Input label="Validade" type="date" value={quote.valid_until} onChange={(e) => setQuote({ ...quote, valid_until: e.target.value })} />
          <label className="md:col-span-2 xl:col-span-3"><span className="mb-1 block text-sm font-medium text-gray-700">Notas</span><textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" rows="4" value={quote.notes} onChange={(e) => setQuote({ ...quote, notes: e.target.value })} /></label>
        </div>
      </section>}

      {step === 1 && <ProfessionCalculator profession={quote.profession} onProfessionChange={(profession) => setQuote({ ...quote, profession })} onItemsCalculated={addItemsToSelected} />}

      {step === 2 && <section className="space-y-5">
        <ZoneForm onAdd={addZone} />
        <div className="grid gap-5 xl:grid-cols-4">
          <div className="xl:col-span-1"><ZoneList zones={zones} selectedId={selectedZone} onSelect={setSelectedZone} onRemove={removeZone} /></div>
          <div className="space-y-4 xl:col-span-3"><ItemForm defaultVat={quote.vat_rate} onAdd={(item) => addItemsToSelected([item])} /><ItemList items={zones.find((zone) => zone.local_id === selectedZone)?.items || []} onRemove={removeItem} /><TotalsBar items={allItems} discountPercent={quote.discount_percent} marginPercent={quote.margin_rate} vatRate={quote.vat_rate} /></div>
        </div>
      </section>}

      {step === 3 && <section className="space-y-5 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">Margens e Resumo</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Margem global (%)" type="number" value={quote.margin_rate} onChange={(e) => setQuote({ ...quote, margin_rate: e.target.value })} />
          <Input label="Desconto (%)" type="number" value={quote.discount_percent} onChange={(e) => setQuote({ ...quote, discount_percent: e.target.value })} />
          <Select label="Regime de IVA" value={quote.vat_rate} options={VAT_REGIMES} onChange={(e) => setQuote({ ...quote, vat_rate: Number(e.target.value) })} />
        </div>
        <TotalsBar items={allItems} discountPercent={quote.discount_percent} marginPercent={quote.margin_rate} vatRate={quote.vat_rate} />
        <div className="overflow-hidden rounded-2xl border"><table className="min-w-full text-sm"><tbody className="divide-y"><tr><td className="px-4 py-3">Subtotal sem IVA</td><td className="px-4 py-3 text-right font-bold">{totals.subtotal.toFixed(2)} €</td></tr><tr><td className="px-4 py-3">IVA</td><td className="px-4 py-3 text-right font-bold">{totals.vat.toFixed(2)} €</td></tr><tr><td className="px-4 py-3">Desconto</td><td className="px-4 py-3 text-right font-bold">{totals.discount.toFixed(2)} €</td></tr><tr className="bg-blue-50"><td className="px-4 py-3 font-bold">Total final</td><td className="px-4 py-3 text-right text-xl font-extrabold text-blue-700">{totals.total.toFixed(2)} €</td></tr></tbody></table></div>
      </section>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button variant="secondary" onClick={() => setStep(Math.max(step - 1, 0))} disabled={step === 0}>Anterior</Button>
        <div className="flex flex-col gap-3 sm:flex-row">
          {step < 3 ? <Button onClick={() => setStep(Math.min(step + 1, 3))}>Seguinte</Button> : <><Button variant="secondary" onClick={() => save('draft')} disabled={saving}>Guardar como Rascunho</Button><Button onClick={() => save('sent')} disabled={saving}>Enviar ao Cliente</Button></>}
        </div>
      </div>
    </div>
  )
}
