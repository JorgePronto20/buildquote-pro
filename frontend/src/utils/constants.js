export const PROFESSIONS = [
  { value: 'electrician', label: 'Eletricista' },
  { value: 'painter', label: 'Pintor' },
  { value: 'plumber', label: 'Canalizador' },
  { value: 'builder', label: 'Pedreiro' },
  { value: 'drywall', label: 'Pladurista' },
  { value: 'carpenter', label: 'Carpinteiro' },
]

export const QUOTE_STATUSES = [
  { value: 'draft', label: 'Rascunho', color: 'bg-gray-100 text-gray-700 ring-gray-200' },
  { value: 'sent', label: 'Enviado', color: 'bg-blue-100 text-blue-700 ring-blue-200' },
  { value: 'accepted', label: 'Aceite', color: 'bg-emerald-100 text-emerald-700 ring-emerald-200' },
  { value: 'approved', label: 'Aprovado', color: 'bg-green-100 text-green-700 ring-green-200' },
  { value: 'cancelled', label: 'Anulado', color: 'bg-red-100 text-red-700 ring-red-200' },
]

export const ZONE_TYPES = ['Quarto', 'Sala', 'Cozinha', 'WC', 'Exterior', 'Outro']

export const ITEM_TYPES = [
  { value: 'material', label: 'Material' },
  { value: 'labor', label: 'Mão de obra' },
  { value: 'consumable', label: 'Consumível' },
  { value: 'equipment', label: 'Equipamento' },
]

export const VAT_REGIMES = [
  { value: 0, label: 'Isento (0%)' },
  { value: 6, label: 'Taxa Reduzida (6%)' },
  { value: 13, label: 'Taxa Intermédia (13%)' },
  { value: 23, label: 'Taxa Normal (23%)' },
]

export const DEFAULT_VAT = 23

export function statusLabel(status) {
  return QUOTE_STATUSES.find((item) => item.value === status)?.label || status || '—'
}

export function professionLabel(profession) {
  return PROFESSIONS.find((item) => item.value === profession)?.label || profession || '—'
}
