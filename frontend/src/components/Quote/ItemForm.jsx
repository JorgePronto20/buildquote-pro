import { useState } from 'react'
import Button from '../UI/Button'
import Input from '../UI/Input'
import Select from '../UI/Select'
import { ITEM_TYPES, DEFAULT_VAT } from '../../utils/constants'

const initial = { item_type: 'material', description: '', quantity: 1, unit: 'un', unit_price: 0, unit_cost: 0, vat_rate: DEFAULT_VAT, margin_rate: 0 }

export default function ItemForm({ onAdd, defaultVat = DEFAULT_VAT }) {
  const [item, setItem] = useState({ ...initial, vat_rate: defaultVat })
  function submit(event) {
    event.preventDefault()
    if (!item.description) return
    onAdd({ ...item, quantity: Number(item.quantity || 0), unit_price: Number(item.unit_price || 0), unit_cost: Number(item.unit_cost || 0), vat_rate: Number(item.vat_rate || 0), margin_rate: Number(item.margin_rate || 0) })
    setItem({ ...initial, vat_rate: defaultVat })
  }
  return (
    <form onSubmit={submit} className="grid gap-3 rounded-2xl border bg-gray-50 p-4 lg:grid-cols-12">
      <div className="lg:col-span-2"><Select label="Tipo" value={item.item_type} options={ITEM_TYPES} onChange={(e) => setItem({ ...item, item_type: e.target.value })} /></div>
      <div className="lg:col-span-4"><Input label="Descrição" value={item.description} onChange={(e) => setItem({ ...item, description: e.target.value })} /></div>
      <Input label="Qtd" type="number" step="0.01" value={item.quantity} onChange={(e) => setItem({ ...item, quantity: e.target.value })} />
      <Input label="Un." value={item.unit} onChange={(e) => setItem({ ...item, unit: e.target.value })} />
      <Input label="Preço Unit." type="number" step="0.01" value={item.unit_price} onChange={(e) => setItem({ ...item, unit_price: e.target.value, unit_cost: e.target.value })} />
      <Input label="IVA %" type="number" value={item.vat_rate} onChange={(e) => setItem({ ...item, vat_rate: e.target.value })} />
      <div className="flex items-end lg:col-span-2"><Button type="submit" className="w-full">Adicionar item</Button></div>
    </form>
  )
}
