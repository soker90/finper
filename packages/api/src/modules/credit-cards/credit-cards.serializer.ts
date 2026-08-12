import type { CreditCardRow, CreditCardMovementRow } from './credit-cards.repository'

export const serializeCreditCard = (card: CreditCardRow | undefined | null) => {
  /* istanbul ignore next — defensive guard; callers always pass an existing card validated upstream */
  if (!card) return null
  return {
    _id: card.id,
    id: card.id,
    name: card.name,
    accountId: card.accountId,
    account: card.account
      ? {
          _id: card.account.id,
          id: card.account.id,
          name: card.account.name,
          bank: card.account.bank,
          balance: card.account.balance
        }
      : null,
    limit: card.limit ?? null,
    currentDebt: card.currentDebt ?? 0,
    user: card.user
  }
}

export const serializeCreditCardMovement = (movement: CreditCardMovementRow | undefined | null) => {
  /* istanbul ignore next — defensive guard; callers always pass an existing movement validated upstream */
  if (!movement) return null
  return {
    _id: movement.id,
    id: movement.id,
    creditCardId: movement.creditCardId,
    date: movement.date,
    amount: movement.amount,
    type: movement.type,
    categoryId: movement.categoryId,
    category: movement.category
      ? {
          _id: movement.category.id,
          id: movement.category.id,
          name: movement.category.name,
          type: movement.category.type
        }
      : null,

    storeId: movement.storeId ?? null,
    store: movement.store
      ? {
          _id: movement.store.id,
          id: movement.store.id,
          name: movement.store.name
        }
      : null,
    note: movement.note ?? null,
    status: movement.status,
    paidAt: movement.paidAt ?? null,
    transactionId: movement.transactionId ?? null,
    user: movement.user
  }
}
