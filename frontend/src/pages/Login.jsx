import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/UI/Button'
import Input from '../components/UI/Input'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(event) {
    event.preventDefault(); setLoading(true); setError('')
    try { await login(form); navigate('/') } catch (err) { setError(err.message || 'Erro ao iniciar sessão') } finally { setLoading(false) }
  }
  return <AuthShell title="Entrar no BuildQuote Pro" subtitle="Aceda aos seus orçamentos profissionais.">
    <form onSubmit={submit} className="space-y-4"><Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /><Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<Button type="submit" className="w-full" disabled={loading}>{loading ? 'A entrar...' : 'Entrar'}</Button></form>
    <p className="mt-5 text-center text-sm text-gray-600">Ainda não tem conta? <Link className="font-semibold text-blue-600" to="/register">Criar conta</Link></p>
  </AuthShell>
}

export function AuthShell({ title, subtitle, children }) {
  return <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1e3a5f] to-blue-700 p-4"><div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"><div className="mb-6 text-center"><div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl">🔧</div><h1 className="text-2xl font-extrabold text-gray-900">{title}</h1><p className="mt-2 text-sm text-gray-500">{subtitle}</p></div>{children}</div></div>
}
