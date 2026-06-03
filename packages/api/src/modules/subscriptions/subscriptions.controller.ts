import { Request, Response } from 'express'
import { SubscriptionsService } from './subscriptions.service'
import { SubscriptionCandidateService } from './subscription-candidate.service'
import {
  validateSubscriptionCreateParams,
  validateSubscriptionEditParams,
  validateSubscriptionExist,
  validateSubscriptionLinkParams,
  validateCandidateExist
} from './subscriptions.schema'

export class SubscriptionsController {
  private logger
  private subscriptionsService: SubscriptionsService
  private subscriptionCandidateService: SubscriptionCandidateService

  constructor ({ loggerHandler, subscriptionsService, subscriptionCandidateService }: { loggerHandler: any, subscriptionsService: SubscriptionsService, subscriptionCandidateService: SubscriptionCandidateService }) {
    this.logger = loggerHandler
    this.subscriptionsService = subscriptionsService
    this.subscriptionCandidateService = subscriptionCandidateService
  }

  public async create (req: Request, res: Response): Promise<void> {
    this.logger.logInfo('/create - new subscription')
    const params = validateSubscriptionCreateParams({ ...req.body, user: req.user })
    const response = this.subscriptionsService.addSubscription(params)
    res.send(response)
  }

  public async list (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/subscriptions - list for ${req.user}`)
    const response = this.subscriptionsService.getSubscriptions(req.user as string)
    res.send(response)
  }

  public async edit (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/edit - subscription: ${req.params.id}`)
    const { id, value } = validateSubscriptionEditParams({ params: req.params, body: req.body, user: req.user as string })
    const response = this.subscriptionsService.editSubscription(id, value, req.user as string)
    res.send(response)
  }

  public async delete (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/delete - subscription: ${id}`)
    validateSubscriptionExist(id, req.user as string)
    this.subscriptionsService.deleteSubscription(id, req.user as string)
    res.status(204).send()
  }

  // --- Parte B ---
  public async getTransactions (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/transactions - subscription: ${id}`)
    validateSubscriptionExist(id, req.user as string)
    const response = this.subscriptionsService.getTransactionsBySubscription(id, req.user as string)
    res.send(response)
  }

  public async getMatchingTransactions (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/matching-transactions - subscription: ${id}`)
    const response = this.subscriptionsService.getMatchingTransactions(id, req.user as string)
    res.send(response)
  }

  public async linkTransactions (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/link-transactions - subscription: ${id}`)
    validateSubscriptionExist(id, req.user as string)
    const { transactionIds } = validateSubscriptionLinkParams({ id, transactionIds: req.body.transactionIds, user: req.user })
    this.subscriptionsService.linkTransactions(id, transactionIds)
    res.status(204).send()
  }

  public async unlinkTransaction (req: Request, res: Response): Promise<void> {
    const { id, transactionId } = req.params
    this.logger.logInfo(`/unlink-transaction - subscription: ${id}, transaction: ${transactionId}`)
    validateSubscriptionExist(id, req.user as string)
    this.subscriptionsService.unlinkTransaction(id, transactionId)
    res.status(204).send()
  }

  // --- Parte C: candidates ---
  public async listCandidates (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/subscription-candidates - list for ${req.user}`)
    const response = this.subscriptionCandidateService.getCandidates(req.user as string)
    res.send(response)
  }

  public async assignCandidate (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const { subscriptionId } = req.body
    this.logger.logInfo(`/assign - candidate: ${id} -> subscription: ${subscriptionId}`)
    validateCandidateExist(id, req.user as string)
    this.subscriptionCandidateService.assignSubscription(id, subscriptionId)
    res.status(204).send()
  }

  public async dismissCandidate (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/dismiss - candidate: ${id}`)
    validateCandidateExist(id, req.user as string)
    this.subscriptionCandidateService.dismissCandidate(id)
    res.status(204).send()
  }
}
