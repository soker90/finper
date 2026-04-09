import { Router } from 'express'

import loggerHandler from '../utils/logger'
import { subscriptionService, subscriptionCandidateService } from '../services'
import authMiddleware from '../middlewares/auth.middleware'
import { SubscriptionController } from '../controllers/subscription.controller'

export class SubscriptionRoutes {
  router: Router

  public subscriptionController: SubscriptionController = new SubscriptionController({
    subscriptionService,
    subscriptionCandidateService,
    loggerHandler: loggerHandler('SubscriptionController')
  })

  constructor () {
    this.router = Router()
    this.routes()
  }

  routes () {
    // Subscriptions CRUD
    this.router.post('/', authMiddleware, this.subscriptionController.create.bind(this.subscriptionController))
    this.router.get('/', authMiddleware, this.subscriptionController.list.bind(this.subscriptionController))

    // Candidates (rutas estáticas antes de las dinámicas con :id)
    this.router.get('/candidates', authMiddleware, this.subscriptionController.listCandidates.bind(this.subscriptionController))
    this.router.post('/candidates/:id/assign', authMiddleware, this.subscriptionController.assignCandidate.bind(this.subscriptionController))
    this.router.post('/candidates/:id/dismiss', authMiddleware, this.subscriptionController.dismissCandidate.bind(this.subscriptionController))

    // Subscription detail (rutas dinámicas con :id)
    this.router.get('/:id/transactions', authMiddleware, this.subscriptionController.getTransactions.bind(this.subscriptionController))
    this.router.get('/:id/matching-transactions', authMiddleware, this.subscriptionController.getMatchingTransactions.bind(this.subscriptionController))
    this.router.post('/:id/link-transactions', authMiddleware, this.subscriptionController.linkTransactions.bind(this.subscriptionController))
    this.router.delete('/:id/unlink-transactions/:transactionId', authMiddleware, this.subscriptionController.unlinkTransaction.bind(this.subscriptionController))
    this.router.put('/:id', authMiddleware, this.subscriptionController.edit.bind(this.subscriptionController))
    this.router.delete('/:id', authMiddleware, this.subscriptionController.delete.bind(this.subscriptionController))
  }
}
