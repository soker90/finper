import { serializeCandidate } from './subscriptions.serializer'
import { SubscriptionsService } from './subscriptions.service'

type ISubscriptionsRepository = ReturnType<typeof import('./subscriptions.repository').createSubscriptionsRepository>

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

interface TransactionForDetect {
  id: string
  date: number
  categoryId: string
  accountId: string
  user: string
}

const uniqueIds = (ids: string[]): string[] => [...new Set(ids)]

export class SubscriptionCandidateService {
  constructor (
    private repository: ISubscriptionsRepository,
    private subscriptionsService: SubscriptionsService
  ) {}

  public detectCandidates (transaction: TransactionForDetect): void {
    const from = transaction.date - ONE_WEEK_MS
    const to = transaction.date + ONE_WEEK_MS
    const splitCategoryIds = this.repository.findSplitCategoryIds(transaction.id)
    const categoryIds = uniqueIds([transaction.categoryId, ...splitCategoryIds])

    const matching = categoryIds.flatMap(categoryId =>
      this.repository.findMatchingSubscriptions(
        transaction.user, transaction.accountId, categoryId, from, to
      )
    )
    const uniqueMatching = [...new Map(matching.map(sub => [sub.id, sub])).values()]
    if (uniqueMatching.length === 0) return

    this.repository.createCandidate({
      transactionId: transaction.id,
      subscriptionIds: uniqueMatching.map(sub => sub.id),
      user: transaction.user
    })
  }

  public getCandidates (user: string) {
    return this.repository.findCandidatesByUser(user).map(candidate => {
      const transaction = this.repository.findTransactionById(candidate.transactionId)
      const subs = this.repository.findSubscriptionsByIds(candidate.subscriptionIds)
      return serializeCandidate(candidate, transaction, subs)
    })
  }

  public assignSubscription (candidateId: string, subscriptionId: string): void {
    const candidate = this.repository.findCandidateById(candidateId)
    this.repository.deleteCandidate(candidateId)
    /* v8 ignore next — validateCandidateExist runs before via controller */
    if (!candidate) return

    this.repository.linkTransactions(subscriptionId, [candidate.transactionId])
    try {
      this.subscriptionsService.recalculateNextPaymentDate(subscriptionId)
    } catch { /* fire-and-forget, no rompe la asignación */ }
  }

  public dismissCandidate (candidateId: string): void {
    this.repository.deleteCandidate(candidateId)
  }
}
