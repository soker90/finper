import { useEffect, useReducer } from 'react'
import { type SimulationResult } from 'types'
import { simulateLoanPayoff } from 'services/apiService'

interface SimulationState {
  result: SimulationResult | null
  loading: boolean
  error: string | null
}

type SimulationAction =
  | { type: 'loading' }
  | { type: 'success'; payload: SimulationResult | null }
  | { type: 'error'; payload: string }
  | { type: 'reset' }

const initialState: SimulationState = {
  result: null,
  loading: false,
  error: null
}

const simulationReducer = (state: SimulationState, action: SimulationAction): SimulationState => {
  switch (action.type) {
    case 'loading':
      return { result: null, loading: true, error: null }
    case 'success':
      return { result: action.payload, loading: false, error: null }
    case 'error':
      return { result: null, loading: false, error: action.payload }
    case 'reset':
      return initialState
    default:
      return state
  }
}

interface UseLoanSimulationReturn {
  result: SimulationResult | null
  loading: boolean
  error: string | null
}

export const useLoanSimulation = (loanId: string, lumpSum: number): UseLoanSimulationReturn => {
  const [state, dispatch] = useReducer(simulationReducer, initialState)

  useEffect(() => {
    if (lumpSum <= 0) {
      dispatch({ type: 'reset' })
      return
    }

    let cancelled = false
    dispatch({ type: 'loading' })

    simulateLoanPayoff(loanId, lumpSum)
      .then((response) => {
        if (cancelled) return
        if (response.error) {
          dispatch({ type: 'error', payload: response.error })
        } else {
          dispatch({ type: 'success', payload: response.data ?? null })
        }
      })
      .catch(() => {
        if (!cancelled) {
          dispatch({ type: 'error', payload: 'Error al calcular la simulación' })
        }
      })

    return () => { cancelled = true }
  }, [loanId, lumpSum])

  return state
}
