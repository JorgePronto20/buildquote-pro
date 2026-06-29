import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AppLayout from './components/Layout/AppLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import QuoteList from './pages/Quotes/QuoteList'
import QuoteNew from './pages/Quotes/QuoteNew'
import QuoteDetail from './pages/Quotes/QuoteDetail'
import QuotePublic from './pages/Quotes/QuotePublic'
import Materials from './pages/Materials'
import Settings from './pages/Settings'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-500">A preparar sessão...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function PublicOnly({ children }) {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/public/:token" element={<QuotePublic />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="quotes" element={<QuoteList />} />
        <Route path="quotes/new" element={<QuoteNew />} />
        <Route path="quotes/:id" element={<QuoteDetail />} />
        <Route path="materials" element={<Materials />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
