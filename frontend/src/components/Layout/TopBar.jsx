import Button from '../UI/Button'
import { useAuth } from '../../hooks/useAuth'

export default function TopBar({ onMenu }) {
  const { user, logout } = useAuth()
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between bg-white px-4 shadow-sm lg:px-8 print:hidden">
      <div className="flex items-center gap-3">
        <button className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 lg:hidden" onClick={onMenu}>☰</button>
        <div>
          <h1 className="text-base font-bold text-gray-900 sm:text-xl">Gestão de Orçamentos</h1>
          <p className="hidden text-xs text-gray-500 sm:block">Criação rápida, cálculo automático e aprovação online.</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block"><p className="text-sm font-semibold text-gray-900">{user?.name || 'Profissional'}</p><p className="text-xs text-gray-500">{user?.email}</p></div>
        <Button variant="secondary" onClick={logout}>Sair</Button>
      </div>
    </header>
  )
}
