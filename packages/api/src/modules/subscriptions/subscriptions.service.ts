import { serializeSubscription, serializeSubscriptionPopulated } from './subscriptions.serializer'

type ISubscriptionsRepository = ReturnType<typeof import('./subscriptions.repository').createSubscriptionsRepository>

export const advanceDate = (timestamp: number, cycle: number): number => {
  const date = new Date(timestamp)
  const originalDay = date.getDate()
  date.setMonth(date.getMonth() + cycle)
  if (date.getDate() !== originalDay) {
    date.setDate(0)
  }
  return date.getTime()
}

export class SubscriptionsService {
  constructor (private repository: ISubscriptionsRepository) {}

  public getSubscriptions (user: string) {
    return this.repository.findByUser(user).map(serializeSubscriptionPopulated)
  }

  public getSubscription (id: string, user: string) {
    const row = this.repository.findByIdPopulated(id, user)
    return row ? serializeSubscriptionPopulated(row) : null
  }

  public addSubscription (params: any) {
    const created = this.repository.create({
      name: params.name,
      amount: params.amount,
      cycle: params.cycle,
      categoryId: params.categoryId,
      accountId: params.accountId,
      logoUrl: params.logoUrl ?? null,
      user: params.user
    })
    return serializeSubscription(created)
  }

  public editSubscription (id: string, value: any, user: string) {
    const updated = this.repository.update(id, user, value)
    if (!updated) return null

    if ('cycle' in value) {
      const nextPaymentDate = this.recalculateNextPaymentDate(id)
      return serializeSubscription({ ...updated, nextPaymentDate })
    }
    return serializeSubscription(updated)
  }

  public deleteSubscription (id: string, user: string): void {
    this.repository.unlinkAllTransactions(id)
    this.repository.delete(id, user)
  }

  public recalculateNextPaymentDate (subscriptionId: string): number | null {
    const subscription = this.repository.findByIdAny(subscriptionId)
    if (!subscription) return null

    const lastDate = this.repository.findLatestTransactionDate(subscriptionId)
    const nextPaymentDate = lastDate !== null ? advanceDate(lastDate, subscription.cycle) : null

    this.repository.updateNextPaymentDate(subscriptionId, nextPaymentDate)
    return nextPaymentDate
  }
}
