import { useCallback, useEffect, useState } from 'react'
import { quotesApi } from '../api/quotes'

export function useQuotes(params = {}) {
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadQuotes = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await quotesApi.list(params)
      setQuotes(data.quotes || [])
    } catch (err) {
      setError(err.message || 'Não foi possível carregar os orçamentos')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(params)])

  useEffect(() => { loadQuotes() }, [loadQuotes])

  return { quotes, loading, error, reload: loadQuotes, setQuotes }
}
