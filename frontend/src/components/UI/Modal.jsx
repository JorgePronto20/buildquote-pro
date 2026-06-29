import Button from './Button'

export default function Modal({ open, title, children, onClose, footer }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <Button variant="ghost" onClick={onClose} className="px-2">✕</Button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="border-t bg-gray-50 px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}
