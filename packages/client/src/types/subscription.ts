export interface Subscription {
  _id: string
  name: string
  amount: number
  /** Número de meses entre pagos (ej. 1 = mensual, 3 = trimestral, 12 = anual). */
  cycle: number
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
  /** Número de meses entre pagos. */
  cycle: number
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
    /** Número de meses entre pagos. */
    cycle: number
    nextPaymentDate: number
  }>
  createdAt: string
}
