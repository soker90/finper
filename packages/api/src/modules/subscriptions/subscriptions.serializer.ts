import { schema } from '@soker90/finper-db'
import type { SubscriptionRow, SubscriptionTransactionRow } from './subscriptions.repository'

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

export const serializeSubscriptionTransaction = (row: SubscriptionTransactionRow) => {
  const result: Record<string, any> = {
    _id: row.id,
    date: row.date,
    amount: row.amount,
    type: row.type,
    tags: row.tags,
    category: { _id: row.categoryId, name: row.categoryName },
    account: { _id: row.accountId, name: row.accountName, bank: row.accountBank }
  }
  if (row.note !== null) result.note = row.note
  if (row.storeId !== null) result.store = { _id: row.storeId, name: row.storeName }
  if (row.subscriptionId !== null) result.subscriptionId = row.subscriptionId
  return result
}

// Parte C: candidate con transactionId y subscriptionIds poblados.
type CandidateRow = typeof schema.subscriptionCandidates.$inferSelect
type PopulatedSub = { id: string, name: string, logoUrl: string | null, amount: number, cycle: number, nextPaymentDate: number | null }

export const serializeCandidate = (
  candidate: CandidateRow,
  transaction: SubscriptionTransactionRow | undefined,
  subs: PopulatedSub[]
) => ({
  _id: candidate.id,
  transactionId: transaction ? serializeSubscriptionTransaction(transaction) : null,
  subscriptionIds: subs.map(s => ({
    _id: s.id,
    name: s.name,
    logoUrl: s.logoUrl,
    amount: s.amount,
    cycle: s.cycle,
    nextPaymentDate: s.nextPaymentDate
  })),
  user: candidate.user,
  createdAt: candidate.createdAt
})
