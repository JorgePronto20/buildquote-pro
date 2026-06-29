import { useMemo, useState } from 'react'
import { professionsApi } from '../../api/professions'
import Button from '../UI/Button'
import Input from '../UI/Input'
import Select from '../UI/Select'
import { PROFESSIONS } from '../../utils/constants'
import { formatMoney } from '../../utils/money'

const fieldSets = {
  electrician: [
    { name: 'area_m2', label: 'Área m²' },
    { name: 'pontos_tomada', label: 'Pontos de tomada' },
    { name: 'pontos_iluminacao', label: 'Pontos de iluminação' },
    { name: 'num_divisoes', label: 'N.º divisões' },
  ],
  painter: [
    { name: 'area_m2', label: 'Área m²' },
    { name: 'num_coats', label: 'N.º demãos' },
    { name: 'tem_teto', label: 'Tem teto', type: 'checkbox' },
  ],
  plumber: [
    { name: 'metros_tubagem', label: 'Metros de tubagem' },
    { name: 'pontos_agua', label: 'Pontos de água' },
    { name: 'num_loucas', label: 'N.º louças' },
  ],
}

export default function ProfessionCalculator({ profession, onProfessionChange, onItemsCalculated }) {
  const [inputs, setInputs] = useState({ area_m2: 80, pontos_tomada: 12, pontos_iluminacao: 8, num_divisoes: 4, num_coats: 2, metros_tubagem: 20, pontos_agua: 5, num_loucas: 3, tem_teto: false })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fields = useMemo(() => fieldSets[profession] || [], [profession])

  async function calculate() {
    setLoading(true); setError('')
    try {
      const data = await professionsApi.calculate({ profession, inputs })
      const items = data.items || data.result?.items || []
      setResult({ ...data, items })
      onItemsCalculated(items.map((item, index) => ({
        local_id: `calc-${Date.now()}-${index}`,
        item_type: item.item_type || item.type || (String(item.description || '').toLowerCase().includes('mão') ? 'labor' : 'material'),
        code: item.code || null,
        description: item.description || item.name || 'Item calculado',
        quantity: Number(item.quantity || item.qty || 1),
        unit: item.unit || 'un',
        unit_cost: Number(item.unit_cost || item.unit_price || item.price || 0),
        unit_price: Number(item.unit_price || item.price || item.unit_cost || 0),
        vat_rate: Number(item.vat_rate ?? 23),
        margin_rate: Number(item.margin_rate || 0),
      })))
    } catch (err) {
      setError(err.message || 'Não foi possível calcular')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-4">
        <Select label="Profissão" value={profession} options={PROFESSIONS} onChange={(e) => onProfessionChange(e.target.value)} />
        {fields.map((field) => field.type === 'checkbox' ? (
          <label key={field.name} className="flex items-end gap-2 rounded-lg pb-2 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={Boolean(inputs[field.name])} onChange={(e) => setInputs({ ...inputs, [field.name]: e.target.checked })} /> {field.label}
          </label>
        ) : (
          <Input key={field.name} label={field.label} type="number" value={inputs[field.name] || ''} onChange={(e) => setInputs({ ...inputs, [field.name]: Number(e.target.value) })} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3"><Button onClick={calculate} disabled={!fields.length || loading}>{loading ? 'A calcular...' : 'Calcular'}</Button>{error && <p className="text-sm text-red-600">{error}</p>}</div>
      {result?.items?.length > 0 && (
        <div className="rounded-xl bg-blue-50 p-4">
          <h4 className="font-bold text-gray-900">Materiais sugeridos</h4>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((item, index) => <div key={index} className="rounded-lg bg-white p-3 text-sm shadow-sm"><p className="font-semibold">{item.description || item.name}</p><p className="text-gray-500">{item.quantity || item.qty || 1} {item.unit || 'un'} · {formatMoney(item.unit_price || item.price || 0)}</p></div>)}
          </div>
        </div>
      )}
      {!fields.length && <p className="text-sm text-amber-700">Esta profissão ainda não tem motor automático no backend; pode adicionar itens manualmente no passo seguinte.</p>}
    </div>
  )
}
