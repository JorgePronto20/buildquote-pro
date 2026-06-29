import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { authApi } from '../api/auth'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('bq_user')
    return raw ? JSON.parse(raw) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('bq_token'))
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('bq_token')))

  const persistSession = useCallback((data) => {
    localStorage.setItem('bq_token', data.token)
    localStorage.setItem('bq_user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
  }, [])

  const login = useCallback(async (payload) => {
    const data = await authApi.login(payload)
    persistSession(data)
    return data
  }, [persistSession])

  const register = useCallback(async (payload) => {
    const data = await authApi.register(payload)
    persistSession(data)
    return data
  }, [persistSession])

  const logout = useCallback(() => {
    localStorage.removeItem('bq_token')
    localStorage.removeItem('bq_user')
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    let active = true
    authApi.me()
      .then((data) => {
        if (!active) return
        setUser(data.user)
        localStorage.setItem('bq_user', JSON.stringify(data.user))
      })
      .catch(() => {
        if (active) logout()
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [token, logout])

  const value = useMemo(() => ({ user, token, loading, isAuthenticated: Boolean(token), login, register, logout }), [user, token, loading, login, register, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
