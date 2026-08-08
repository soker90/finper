import useSWR, { mutate } from 'swr'
import { CREDIT_CARDS, CREDIT_CARD_DETAIL, CREDIT_CARD_MOVEMENTS, ACCOUNTS } from 'constants/api-paths'
import type { CreditCard, CreditCardMovement } from 'types'

export const useCreditCards = () => {
  const { data, error, isLoading } = useSWR<CreditCard[]>(CREDIT_CARDS)
  return {
    creditCards: data ?? [],
    isLoading,
    error: error as Error | undefined
  }
}

export const useCreditCardDetail = (id?: string) => {
  const { data, error, isLoading } = useSWR<CreditCard>(id ? CREDIT_CARD_DETAIL(id) : null)
  return {
    creditCard: data ?? null,
    isLoading,
    error: error as Error | undefined
  }
}

export const useCreditCardMovements = (id?: string, status?: string) => {
  const url = id ? `${CREDIT_CARD_MOVEMENTS(id)}${status ? `?status=${status}` : ''}` : null
  const { data, error, isLoading } = useSWR<CreditCardMovement[]>(url)
  return {
    movements: data ?? [],
    isLoading,
    error: error as Error | undefined
  }
}

export const useCreditCardMutate = (id?: string) => () => {
  mutate(CREDIT_CARDS)
  mutate(ACCOUNTS)
  if (id) {
    mutate(CREDIT_CARD_DETAIL(id))
    mutate(CREDIT_CARD_MOVEMENTS(id))
    mutate(`${CREDIT_CARD_MOVEMENTS(id)}?status=pending`)
    mutate(`${CREDIT_CARD_MOVEMENTS(id)}?status=paid`)
  }
}
