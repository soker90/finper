import { Request, Response } from 'express'

import '../auth/local-strategy-passport-handler'
import { ISubscriptionService } from '../services/subscription.service'
import { ISubscriptionCandidateService } from '../services/subscription-candidate.service'
import {
  validateSubscriptionCreateParams,
  validateSubscriptionEditParams,
  validateSubscriptionExist,
  validateSubscriptionLinkParams
} from '../validators/subscription'
import { validateCandidateExist } from '../validators/subscription-candidate'

type ISubscriptionController = {
  loggerHandler: any,
  subscriptionService: ISubscriptionService,
  subscriptionCandidateService: ISubscriptionCandidateService,
}

export class SubscriptionController {
  private logger
  private subscriptionService
  private subscriptionCandidateService

  constructor ({ loggerHandler, subscriptionService, subscriptionCandidateService }: ISubscriptionController) {
    this.logger = loggerHandler
    this.subscriptionService = subscriptionService
    this.subscriptionCandidateService = subscriptionCandidateService
  }

  public async create (req: Request, res: Response): Promise<void> {
    this.logger.logInfo('/create - new subscription')

    const params = await validateSubscriptionCreateParams({ ...req.body, user: req.user })
    const response = await this.subscriptionService.addSubscription(params)

    /* istanbul ignore next */
    if (response) this.logger.logInfo(`Subscription ${response.id} has been successfully created`)
    res.send(response)
  }

  public async list (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/subscriptions - list for ${req.user}`)

    const response = await this.subscriptionService.getSubscriptions(req.user)
    res.send(response)
  }

  public async edit (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/edit - subscription: ${req.params.id}`)

    const { id, value } = await validateSubscriptionEditParams({ params: req.params, body: req.body, user: req.user })
    const response = await this.subscriptionService.editSubscription(id, value)

    /* istanbul ignore next */
    if (response) this.logger.logInfo(`Subscription ${response.id} has been successfully edited`)
    res.send(response)
  }

  public async delete (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/delete - subscription: ${id}`)

    await validateSubscriptionExist(id, req.user)
    await this.subscriptionService.deleteSubscription(id)

    res.status(204).send()
  }

  public async getMatchingTransactions (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/matching-transactions - subscription: ${id}`)

    const response = await this.subscriptionService.getMatchingTransactions(id, req.user)
    res.send(response)
  }

  public async linkTransactions (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/link-transactions - subscription: ${id}`)

    await validateSubscriptionExist(id, req.user)
    const { transactionIds } = validateSubscriptionLinkParams({ id, transactionIds: req.body.transactionIds, user: req.user })
    await this.subscriptionService.linkTransactions(id, transactionIds)

    res.status(204).send()
  }

  public async unlinkTransaction (req: Request, res: Response): Promise<void> {
    const { id, transactionId } = req.params
    this.logger.logInfo(`/unlink-transaction - subscription: ${id}, transaction: ${transactionId}`)

    await validateSubscriptionExist(id, req.user)
    await this.subscriptionService.unlinkTransaction(id, transactionId)

    res.status(204).send()
  }

  // --- Candidates ---

  public async getTransactions (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/transactions - subscription: ${id}`)

    await validateSubscriptionExist(id, req.user)
    const response = await this.subscriptionService.getTransactionsBySubscription(id, req.user)

    res.send(response)
  }

  public async listCandidates (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/subscription-candidates - list for ${req.user}`)

    const response = await this.subscriptionCandidateService.getCandidates(req.user)
    res.send(response)
  }

  public async assignCandidate (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const { subscriptionId } = req.body
    this.logger.logInfo(`/assign - candidate: ${id} → subscription: ${subscriptionId}`)

    await validateCandidateExist(id, req.user)
    await this.subscriptionCandidateService.assignSubscription(id, subscriptionId)

    res.status(204).send()
  }

  public async dismissCandidate (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/dismiss - candidate: ${id}`)

    await validateCandidateExist(id, req.user)
    await this.subscriptionCandidateService.dismissCandidate(id)

    res.status(204).send()
  }
}
