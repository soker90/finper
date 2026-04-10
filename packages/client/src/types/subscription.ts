export const SUBSCRIPTION_CYCLE = {
  MONTHLY: 'monthly',
  BIMONTHLY: 'bimonthly',
  QUARTERLY: 'quarterly',
  SEMI_ANNUALLY: 'semi-annually',
  ANNUALLY: 'annually',
} as const

export type SubscriptionCycle = typeof SUBSCRIPTION_CYCLE[keyof typeof SUBSCRIPTION_CYCLE]

export interface Subscription {
  _id: string
  name: string
  amount: number
  cycle: SubscriptionCycle
  nextPaymentDate?: number | null
  categoryId: {
    _id: string
    name: string
  }
  accountId: {
    _id: string
    name: string
    bank: string
  }
  logoUrl?: string
}

export interface SubscriptionInput {
  name: string
  amount: number
  cycle: SubscriptionCycle
  categoryId: string
  accountId: string
  logoUrl?: string
}

export interface SubscriptionCandidate {
  _id: string
  transactionId: {
    _id: string
    date: number
    amount: number
    category: { _id: string, name: string }
    account: { _id: string, name: string, bank: string }
    note?: string
  }
  subscriptionIds: Array<{
    _id: string
    name: string
    logoUrl?: string
    amount: number
    cycle: SubscriptionCycle
    nextPaymentDate: number
  }>
  createdAt: string
}
