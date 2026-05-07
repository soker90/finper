import { useState, useEffect } from 'react'
import { type SimulationResult } from 'types'
import { simulateLoanPayoff } from 'services/apiService'

interface UseLoanSimulationReturn {
  result: SimulationResult | null
  loading: boolean
  error: string | null
}

export const useLoanSimulation = (loanId: string, lumpSum: number): UseLoanSimulationReturn => {
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (lumpSum <= 0) {
      setResult(null)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    simulateLoanPayoff(loanId, lumpSum)
      .then((response) => {
        if (cancelled) return
        if (response.error) {
          setError(response.error)
          setResult(null)
        } else {
          setResult(response.data ?? null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Error al calcular la simulación')
          setResult(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [loanId, lumpSum])

  return { result, loading, error }
}
