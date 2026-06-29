import Button from '../UI/Button'

export default function ZoneList({ zones = [], selectedId, onSelect, onRemove }) {
  return (
    <div className="space-y-2">
      {zones.map((zone, index) => (
        <div key={zone.local_id || zone.id} className={`flex items-center justify-between rounded-xl border p-3 ${selectedId === (zone.local_id || zone.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
          <button type="button" onClick={() => onSelect(zone.local_id || zone.id)} className="text-left">
            <p className="font-semibold text-gray-900">{zone.name || `Zona ${index + 1}`}</p>
            <p className="text-xs text-gray-500">{zone.items?.length || 0} itens</p>
          </button>
          <Button variant="ghost" className="px-2 text-red-600" onClick={() => onRemove(zone.local_id || zone.id)}>Remover</Button>
        </div>
      ))}
    </div>
  )
}
