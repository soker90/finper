import { useState } from 'react'

/** Shared submit flow for forms/modals whose action resolves to `{ error? }`:
 * captures the failed result or calls onSuccess. Used by TransactionEdit,
 * CreditCardMovementEdit, ModalMovement and other domain forms. */
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
