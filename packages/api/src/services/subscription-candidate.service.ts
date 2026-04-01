import {
  ISubscription,
  ISubscriptionCandidate,
  ITransaction,
  SubscriptionCandidateModel,
  SubscriptionModel,
  TransactionModel
} from '@soker90/finper-models'
import SubscriptionService from './subscription.service'

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

export interface ISubscriptionCandidateService {
  detectCandidates(transaction: ITransaction): Promise<void>
  getCandidates(user: string): Promise<ISubscriptionCandidate[]>
  assignSubscription(candidateId: string, subscriptionId: string): Promise<void>
  dismissCandidate(candidateId: string): Promise<void>
}

export default class SubscriptionCandidateService implements ISubscriptionCandidateService {
  /**
   * Called after a transaction is created (fire-and-forget).
   * Finds active subscriptions matching account + category with nextPaymentDate within ±7 days.
   */
  async detectCandidates (transaction: ITransaction): Promise<void> {
    const from = transaction.date - ONE_WEEK_MS
    const to = transaction.date + ONE_WEEK_MS

    const matchingSubscriptions = await SubscriptionModel.find({
      user: transaction.user,
      accountId: transaction.account,
      categoryId: transaction.category,
      nextPaymentDate: { $gte: from, $lte: to }
    })

    if (matchingSubscriptions.length === 0) return

    const subscriptionIds = matchingSubscriptions.map((s: ISubscription) => s._id!)

    await SubscriptionCandidateModel.create({
      transactionId: transaction._id,
      subscriptionIds,
      user: transaction.user
    })
  }

  async getCandidates (user: string): Promise<ISubscriptionCandidate[]> {
    return SubscriptionCandidateModel.find({ user })
      .populate({
        path: 'transactionId',
        populate: [
          { path: 'category', select: 'name' },
          { path: 'account', select: 'name bank' }
        ]
      })
      .populate('subscriptionIds', 'name logoUrl amount cycle nextPaymentDate')
      .sort({ createdAt: -1 })
  }

  /**
   * User picks which subscription this transaction belongs to.
   * Links the transaction, advances nextPaymentDate, deletes candidate.
   */
  async assignSubscription (candidateId: string, subscriptionId: string): Promise<void> {
    const candidate = await SubscriptionCandidateModel.findById(candidateId) as unknown as ISubscriptionCandidate
    if (!candidate) {
      const { notFound } = await import('@hapi/boom')
      throw notFound('Candidate not found').output
    }

    // Vincular la transacción a la suscripción
    await TransactionModel.findByIdAndUpdate(candidate.transactionId, { subscriptionId })

    // Recalcular nextPaymentDate a partir del último pago (fire-and-forget)
    const subscriptionService = new SubscriptionService()
    subscriptionService.recalculateNextPaymentDate(subscriptionId).catch(() => {})

    await SubscriptionCandidateModel.findByIdAndDelete(candidateId)
  }

  /**
   * User says this transaction is NOT a subscription payment.
   * Deletes the candidate without touching the transaction or subscription.
   */
  async dismissCandidate (candidateId: string): Promise<void> {
    await SubscriptionCandidateModel.findByIdAndDelete(candidateId)
  }
}
