import { NextFunction, Request, Response } from 'express'
import { RequestUser } from '../types'

import '../auth/local-strategy-passport-handler'
import extractUser from '../helpers/extract-user'
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

  public async create (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.body)
      .tap(() => this.logger.logInfo('/create - new subscription'))
      .then(extractUser(req))
      .then(validateSubscriptionCreateParams)
      .then(this.subscriptionService.addSubscription.bind(this.subscriptionService))
      .tap((created) => { /* istanbul ignore next */ if (created) this.logger.logInfo(`Subscription ${created.id} has been successfully created`) })
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
    Promise.resolve(req as RequestUser)
      .tap(({ params }) => this.logger.logInfo(`/edit - subscription: ${params.id}`))
      .then(validateSubscriptionEditParams)
      .then(({ id, value }) => this.subscriptionService.editSubscription(id, value))
      .tap((updated) => { /* istanbul ignore next */ if (updated) this.logger.logInfo(`Subscription ${updated.id} has been successfully edited`) })
      .then((response) => { res.send(response) })
      .catch((error) => { next(error) })
  }

  public async delete (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve({ id: req.params.id })
      .tap(({ id }) => this.logger.logInfo(`/delete - subscription: ${id}`))
      .then(extractUser(req))
      .tap(({ id, user }) => validateSubscriptionExist(id, user as string))
      .then(({ id }) => this.subscriptionService.deleteSubscription(id))
      .then(() => { res.status(204).send() })
      .catch((error) => { next(error) })
  }

  public async getMatchingTransactions (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve({ id: req.params.id })
      .tap(({ id }) => this.logger.logInfo(`/matching-transactions - subscription: ${id}`))
      .then(extractUser(req))
      .then(({ id, user }) => this.subscriptionService.getMatchingTransactions(id, user as string))
      .then((response) => { res.send(response) })
      .catch((error) => { next(error) })
  }

  public async linkTransactions (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve({ id: req.params.id, transactionIds: req.body.transactionIds })
      .tap(({ id }) => this.logger.logInfo(`/link-transactions - subscription: ${id}`))
      .then(extractUser(req))
      .tap(({ id, user }) => validateSubscriptionExist(id, user as string))
      .then(validateSubscriptionLinkParams)
      .then(({ id, transactionIds }) => this.subscriptionService.linkTransactions(id, transactionIds))
      .then(() => { res.status(204).send() })
      .catch((error) => { next(error) })
  }

  public async unlinkTransaction (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve({ id: req.params.id, transactionId: req.params.transactionId })
      .tap(({ id, transactionId }) => this.logger.logInfo(`/unlink-transaction - subscription: ${id}, transaction: ${transactionId}`))
      .then(extractUser(req))
      .tap(({ id, user }) => validateSubscriptionExist(id, user))
      .then(({ id, transactionId }) => this.subscriptionService.unlinkTransaction(id, transactionId))
      .then(() => { res.status(204).send() })
      .catch((error) => { next(error) })
  }

  // --- Candidates ---

  public async getTransactions (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve({ id: req.params.id })
      .tap(({ id }) => this.logger.logInfo(`/transactions - subscription: ${id}`))
      .then(extractUser(req))
      .tap(({ id, user }) => validateSubscriptionExist(id, user))
      .then(({ id, user }) => this.subscriptionService.getTransactionsBySubscription(id, user))
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
    Promise.resolve({ id: req.params.id, subscriptionId: req.body.subscriptionId })
      .tap(({ id, subscriptionId }) => this.logger.logInfo(`/assign - candidate: ${id} → subscription: ${subscriptionId}`))
      .then(extractUser(req))
      .tap(({ id, user }) => validateCandidateExist(id, user))
      .then(({ id, subscriptionId }) => this.subscriptionCandidateService.assignSubscription(id, subscriptionId))
      .then(() => { res.status(204).send() })
      .catch((error) => { next(error) })
  }

  public async dismissCandidate (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve({ id: req.params.id })
      .tap(({ id }) => this.logger.logInfo(`/dismiss - candidate: ${id}`))
      .then(extractUser(req))
      .tap(({ id, user }) => validateCandidateExist(id, user))
      .then(({ id }) => this.subscriptionCandidateService.dismissCandidate(id))
      .then(() => { res.status(204).send() })
      .catch((error) => { next(error) })
  }
}
