import type { CreditCardMovement } from 'types'

/** Signed amount of a credit card movement: expenses increase debt (positive),
 * income/refunds reduce debt (negative). */
export const netAmount = (movement: Pick<CreditCardMovement, 'amount' | 'type'>): number =>
  movement.type === 'expense' ? movement.amount : -movement.amount
