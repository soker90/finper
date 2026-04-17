import {
  ISubscription,
  SubscriptionDocument,
  SubscriptionModel,
  TransactionModel,
  TransactionDocument
} from '@soker90/finper-models'

/**
 * Avanza un timestamp tantos meses como indique `cycle` (número de meses entre pagos).
 * Corrige el desbordamiento de día (ej. 31 ene + 1 mes → 28 feb).
 */
export const advanceDate = (timestamp: number, cycle: number): number => {
  const date = new Date(timestamp)
  const originalDay = date.getDate()

  date.setMonth(date.getMonth() + cycle)

  // Si el día desbordó (ej: 31 ene + 1 mes → 2 mar), retroceder al último día del mes correcto
  if (date.getDate() !== originalDay) {
    date.setDate(0)
  }

  return date.getTime()
}

export interface ISubscriptionService {
  getSubscriptions(user: string): Promise<SubscriptionDocument[]>
  getSubscription(id: string, user: string): Promise<SubscriptionDocument | null>
  addSubscription(subscription: ISubscription): Promise<SubscriptionDocument>
  editSubscription(id: string, value: Partial<ISubscription>): Promise<SubscriptionDocument | null>
  deleteSubscription(id: string): Promise<void>
  getActiveSubscriptions(user: string): Promise<SubscriptionDocument[]>
  getTransactionsBySubscription(id: string, user: string): Promise<TransactionDocument[]>
  getMatchingTransactions(id: string, user: string): Promise<TransactionDocument[]>
  linkTransactions(id: string, transactionIds: string[]): Promise<void>
  unlinkTransaction(id: string, transactionId: string): Promise<void>
  recalculateNextPaymentDate(subscriptionId: string): Promise<void>
}

export default class SubscriptionService implements ISubscriptionService {
  async getSubscriptions (user: string): Promise<SubscriptionDocument[]> {
    return SubscriptionModel.find({ user })
      .populate('categoryId', 'name')
      .populate('accountId', 'name bank')
      .sort({ nextPaymentDate: 1 })
  }

  async getSubscription (id: string, user: string): Promise<SubscriptionDocument | null> {
    return SubscriptionModel.findOne({ _id: id, user })
      .populate('categoryId', 'name')
      .populate('accountId', 'name bank')
  }

  async addSubscription (subscription: ISubscription): Promise<SubscriptionDocument> {
    // nextPaymentDate empieza como null (default del schema) — se calculará cuando llegue el primer pago
    const { nextPaymentDate: _omit, ...rest } = subscription as any // eslint-disable-line @typescript-eslint/no-unused-vars
    return SubscriptionModel.create(rest)
  }

  async editSubscription (id: string, value: Partial<ISubscription>): Promise<SubscriptionDocument | null> {
    const updated = await SubscriptionModel.findByIdAndUpdate(id, value, { returnDocument: 'after' })
    if (updated && 'cycle' in value) {
      await this.recalculateNextPaymentDate(id)
    }
    return updated
  }

  async deleteSubscription (id: string): Promise<void> {
    await TransactionModel.updateMany({ subscriptionId: id }, { $unset: { subscriptionId: '' } })
    await SubscriptionModel.findByIdAndDelete(id)
  }

  async getActiveSubscriptions (user: string): Promise<SubscriptionDocument[]> {
    return SubscriptionModel.find({ user })
  }

  async getTransactionsBySubscription (id: string, user: string): Promise<TransactionDocument[]> {
    return TransactionModel.find({ subscriptionId: id, user })
      .populate('category', 'name')
      .populate('account', 'name bank')
      .sort({ date: -1 })
  }

  async getMatchingTransactions (id: string, user: string): Promise<TransactionDocument[]> {
    const subscription = await SubscriptionModel.findOne({ _id: id, user })
    if (!subscription) return []
    return TransactionModel.find({
      user,
      category: subscription.categoryId,
      account: subscription.accountId,
      subscriptionId: { $exists: false }
    })
      .populate('category', 'name')
      .populate('account', 'name bank')
      .sort({ date: -1 })
      .limit(50)
  }

  async linkTransactions (id: string, transactionIds: string[]): Promise<void> {
    await TransactionModel.updateMany(
      { _id: { $in: transactionIds } },
      { $set: { subscriptionId: id } }
    )
    await this.recalculateNextPaymentDate(id)
  }

  async unlinkTransaction (id: string, transactionId: string): Promise<void> {
    await TransactionModel.updateOne(
      { _id: transactionId },
      { $unset: { subscriptionId: '' } }
    )
    await this.recalculateNextPaymentDate(id)
  }

  /**
   * Recalcula nextPaymentDate basándose en el último pago registrado.
   * Si no hay pagos, nextPaymentDate = null (se desconoce la fecha).
   */
  async recalculateNextPaymentDate (subscriptionId: string): Promise<void> {
    const subscription = await SubscriptionModel.findById(subscriptionId)
    if (!subscription) return

    const lastTx = await TransactionModel.findOne({ subscriptionId })
      .sort({ date: -1 })

    const nextPaymentDate = lastTx ? advanceDate(lastTx.date, subscription.cycle) : null

    await SubscriptionModel.findByIdAndUpdate(subscriptionId, { nextPaymentDate })
  }
}
