import { NextFunction, Request, Response } from 'express'

import '../auth/local-strategy-passport-handler'
import extractUser from '../helpers/extract-user'
import { ISubscriptionService } from '../services/subscription.service'
import { ISubscriptionCandidateService } from '../services/subscription-candidate.service'
import {
  validateSubscriptionCreateParams,
  validateSubscriptionEditParams,
  validateSubscriptionExist
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

  public async create (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.body)
      .tap(() => this.logger.logInfo('/create - new subscription'))
      .then(extractUser(req))
      .then(validateSubscriptionCreateParams)
      .then(this.subscriptionService.addSubscription.bind(this.subscriptionService))
      .tap((created) => { if (created) this.logger.logInfo(`Subscription ${created.id} has been successfully created`) })
      .then((response) => { res.send(response) })
      .catch((error) => { next(error) })
  }

  public async list (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.user as string)
      .tap((user) => this.logger.logInfo(`/subscriptions - list for ${user}`))
      .then(this.subscriptionService.getSubscriptions.bind(this.subscriptionService))
      .then((response) => { res.send(response) })
      .catch((error) => { next(error) })
  }

  public async edit (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve({ ...req.body, id: req.params.id })
      .tap(() => this.logger.logInfo(`/edit - subscription: ${req.params.id}`))
      .then(extractUser(req))
      .tap(({ id, user }) => validateSubscriptionExist(id, user as string))
      .then(validateSubscriptionEditParams)
      .then(({ id, value }) => this.subscriptionService.editSubscription(id, value))
      .tap((updated) => { if (updated) this.logger.logInfo(`Subscription ${updated.id} has been successfully edited`) })
      .then((response) => { res.send(response) })
      .catch((error) => { next(error) })
  }

  public async delete (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.params.id)
      .tap((id) => this.logger.logInfo(`/delete - subscription: ${id}`))
      .tap(() => validateSubscriptionExist(req.params.id, req.user as string))
      .then(this.subscriptionService.deleteSubscription.bind(this.subscriptionService))
      .then(() => { res.status(204).send() })
      .catch((error) => { next(error) })
  }

  public async getMatchingTransactions (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params
    Promise.resolve(id)
      .tap(() => this.logger.logInfo(`/matching-transactions - subscription: ${id}`))
      .then(() => this.subscriptionService.getMatchingTransactions(id, req.user as string))
      .then((response) => { res.send(response) })
      .catch((error) => { next(error) })
  }

  public async linkTransactions (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params
    const { transactionIds } = req.body
    Promise.resolve(id)
      .tap(() => this.logger.logInfo(`/link-transactions - subscription: ${id}`))
      .then(() => this.subscriptionService.linkTransactions(id, transactionIds))
      .then(() => { res.status(204).send() })
      .catch((error) => { next(error) })
  }

  public async unlinkTransaction (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { id, transactionId } = req.params
    Promise.resolve({ id, transactionId })
      .tap(() => this.logger.logInfo(`/unlink-transaction - subscription: ${id}, transaction: ${transactionId}`))
      .then(extractUser(req))
      .tap(({ user }) => validateSubscriptionExist(id, user as string))
      .then(() => this.subscriptionService.unlinkTransaction(id, transactionId))
      .then(() => { res.status(204).send() })
      .catch((error) => { next(error) })
  }

  // --- Candidates ---

  public async getTransactions (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params
    Promise.resolve(id)
      .tap(() => this.logger.logInfo(`/transactions - subscription: ${id}`))
      .tap(() => validateSubscriptionExist(id, req.user as string))
      .then(() => this.subscriptionService.getTransactionsBySubscription(id, req.user as string))
      .then((response) => { res.send(response) })
      .catch((error) => { next(error) })
  }

  public async listCandidates (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.user as string)
      .tap((user) => this.logger.logInfo(`/subscription-candidates - list for ${user}`))
      .then(this.subscriptionCandidateService.getCandidates.bind(this.subscriptionCandidateService))
      .then((response) => { res.send(response) })
      .catch((error) => { next(error) })
  }

  public async assignCandidate (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params
    const { subscriptionId } = req.body
    Promise.resolve(id)
      .tap(() => this.logger.logInfo(`/assign - candidate: ${id} → subscription: ${subscriptionId}`))
      .tap(() => validateCandidateExist(id, req.user as string))
      .then(() => this.subscriptionCandidateService.assignSubscription(id, subscriptionId))
      .then(() => { res.status(204).send() })
      .catch((error) => { next(error) })
  }

  public async dismissCandidate (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params
    Promise.resolve(id)
      .tap(() => this.logger.logInfo(`/dismiss - candidate: ${id}`))
      .tap(() => validateCandidateExist(id, req.user as string))
      .then(() => this.subscriptionCandidateService.dismissCandidate(id))
      .then(() => { res.status(204).send() })
      .catch((error) => { next(error) })
  }
}
