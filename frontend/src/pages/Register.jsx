import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/UI/Button'
import Input from '../components/UI/Input'
import Select from '../components/UI/Select'
import { PROFESSIONS } from '../utils/constants'
import { AuthShell } from './Login'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', profession: 'electrician' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(event) {
    event.preventDefault(); setLoading(true); setError('')
    try { await register({ ...form, business_name: form.name }); navigate('/') } catch (err) { setError(err.message || 'Erro ao criar conta') } finally { setLoading(false) }
  }
  return <AuthShell title="Criar conta" subtitle="Configure o seu perfil profissional em segundos.">
    <form onSubmit={submit} className="space-y-4"><Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /><Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /><Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /><Select label="Profissão" value={form.profession} options={PROFESSIONS} onChange={(e) => setForm({ ...form, profession: e.target.value })} />{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<Button type="submit" className="w-full" disabled={loading}>{loading ? 'A criar...' : 'Criar conta'}</Button></form>
    <p className="mt-5 text-center text-sm text-gray-600">Já tem conta? <Link className="font-semibold text-blue-600" to="/login">Entrar</Link></p>
  </AuthShell>
}
