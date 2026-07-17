import { useState } from 'react'

/** Shared submit flow for the yields forms/modals: runs an action that
 * resolves to `{ error? }` (optionally with extra fields, e.g. a conflicting
 * entity id), capturing the failed result or calling onSuccess. */
export const useSubmitError = <T extends { error?: string } = { error?: string }>() => {
  const [result, setResult] = useState<T | null>(null)

  const runSubmit = async (action: () => Promise<T | void>, onSuccess: () => void) => {
    setResult(null)
    const actionResult = await action()
    if (actionResult && actionResult.error) {
      setResult(actionResult)
      return
    }
    onSuccess()
  }

  return { error: result?.error ?? null, result, runSubmit }
}
