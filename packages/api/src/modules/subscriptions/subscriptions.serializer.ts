import { schema } from '@soker90/finper-db'
import type { SubscriptionRow } from './subscriptions.repository'

type Subscription = typeof schema.subscriptions.$inferSelect

const withOptionals = (result: Record<string, any>, s: { currency?: string | null, logoUrl?: string | null }) => {
  if (s.currency !== null && s.currency !== undefined) result.currency = s.currency
  if (s.logoUrl !== null && s.logoUrl !== undefined) result.logoUrl = s.logoUrl
  return result
}

export const serializeSubscription = (s: Subscription) =>
  withOptionals({
    _id: s.id,
    name: s.name,
    amount: s.amount,
    cycle: s.cycle,
    nextPaymentDate: s.nextPaymentDate,
    categoryId: s.categoryId,
    accountId: s.accountId,
    user: s.user
  }, s)

export const serializeSubscriptionPopulated = (row: SubscriptionRow) =>
  withOptionals({
    _id: row.id,
    name: row.name,
    amount: row.amount,
    cycle: row.cycle,
    nextPaymentDate: row.nextPaymentDate,
    categoryId: { _id: row.categoryId, name: row.categoryName },
    accountId: { _id: row.accountId, name: row.accountName, bank: row.accountBank },
    user: row.user
  }, row)
