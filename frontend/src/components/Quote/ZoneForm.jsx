import { useState } from 'react'
import Button from '../UI/Button'
import Input from '../UI/Input'
import Select from '../UI/Select'
import { ZONE_TYPES } from '../../utils/constants'

export default function ZoneForm({ onAdd }) {
  const [zone, setZone] = useState({ name: 'Sala', zone_type: 'Sala', area_m2: '' })
  function submit(event) {
    event.preventDefault()
    onAdd({ ...zone, name: zone.name || zone.zone_type || 'Zona personalizada' })
    setZone({ name: '', zone_type: 'Outro', area_m2: '' })
  }
  return (
    <form onSubmit={submit} className="grid gap-3 rounded-2xl border bg-gray-50 p-4 sm:grid-cols-4">
      <Select label="Tipo" value={zone.zone_type} options={ZONE_TYPES} onChange={(e) => setZone({ ...zone, zone_type: e.target.value, name: e.target.value !== 'Outro' ? e.target.value : zone.name })} />
      <Input label="Nome" value={zone.name} onChange={(e) => setZone({ ...zone, name: e.target.value })} />
      <Input label="Área m²" type="number" value={zone.area_m2} onChange={(e) => setZone({ ...zone, area_m2: e.target.value })} />
      <div className="flex items-end"><Button type="submit" className="w-full">Adicionar zona</Button></div>
    </form>
  )
}
