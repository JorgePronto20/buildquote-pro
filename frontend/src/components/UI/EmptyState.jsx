import Button from './Button'

export default function EmptyState({ icon = '📭', title, description, actionLabel, onAction }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-3 text-lg font-bold text-gray-900">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{description}</p>}
      {actionLabel && <Button onClick={onAction} className="mt-5">{actionLabel}</Button>}
    </div>
  )
}
