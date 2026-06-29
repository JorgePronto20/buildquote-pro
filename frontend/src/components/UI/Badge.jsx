import { QUOTE_STATUSES, statusLabel } from '../../utils/constants'

export default function Badge({ status, children }) {
  const found = QUOTE_STATUSES.find((item) => item.value === status)
  const color = found?.color || 'bg-gray-100 text-gray-700 ring-gray-200'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${color}`}>
      {children || statusLabel(status)}
    </span>
  )
}
