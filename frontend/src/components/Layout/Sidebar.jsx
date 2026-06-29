import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/quotes', label: 'Orçamentos', icon: '🧾' },
  { to: '/quotes/new', label: 'Novo Orçamento', icon: '➕' },
  { to: '/materials', label: 'Materiais', icon: '📦' },
  { to: '/settings', label: 'Configurações', icon: '⚙️' },
]

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <div className={`fixed inset-0 z-30 bg-black/40 lg:hidden ${open ? 'block' : 'hidden'}`} onClick={onClose} />
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 transform bg-[#1e3a5f] text-white transition lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-2xl">🔧</div>
          <div>
            <p className="text-lg font-bold">BuildQuote Pro</p>
            <p className="text-xs text-blue-100">Fase 1 MVP</p>
          </div>
        </div>
        <nav className="space-y-1 px-3 py-5">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={onClose} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${isActive ? 'bg-white text-[#1e3a5f]' : 'text-blue-50 hover:bg-white/10'}`}>
              <span>{item.icon}</span><span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
