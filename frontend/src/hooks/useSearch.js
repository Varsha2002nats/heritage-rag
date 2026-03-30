import { useState, useCallback } from 'react'
import { submitQuery } from '../services/api'

export function useSearch() {
  const [answer, setAnswer] = useState(null)
  const [sources, setSources] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const search = useCallback(async (question, language = 'English') => {
    if (!question?.trim()) return

    setStatus('retrieving')
    setAnswer(null)
    setSources([])
    setError(null)

    try {
      // Phase 1: show "retrieving" briefly so the user sees staged feedback
      await new Promise(resolve => setTimeout(resolve, 400))
      setStatus('generating')

      const data = await submitQuery(question.trim(), language)

      setAnswer(data.answer ?? '')
      setSources(data.sources ?? [])
      setStatus('done')
    } catch (err) {
      setError(
        err?.response?.data?.detail ??
        err?.message ??
        'Something went wrong. Please try again.'
      )
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    setAnswer(null)
    setSources([])
    setStatus('idle')
    setError(null)
  }, [])

  return { answer, sources, status, error, search, reset }
}
