import { Router } from 'express'
import loggerHandler from '../../utils/logger'
import authMiddleware from '../../middlewares/auth.middleware'
import { db } from '../../db'
import { createTransactionsRepository } from './transactions.repository'
import { TransactionsService } from './transactions.service'
import { TransactionsController } from './transactions.controller'
import { createStoresRepository } from '../stores/stores.repository'
import { StoresService } from '../stores/stores.service'
import { createSubscriptionsRepository } from '../subscriptions/subscriptions.repository'
import { SubscriptionsService } from '../subscriptions/subscriptions.service'
import { SubscriptionCandidateService } from '../subscriptions/subscription-candidate.service'

export const transactionsRoutes = Router()

const repository = createTransactionsRepository(db)

// Hooks a subscriptions (fire-and-forget). Instancias propias sobre el singleton:
// stateless, evita acoplar el montaje de subscriptions.routes.
const subscriptionsRepository = createSubscriptionsRepository(db)
const subscriptionsService = new SubscriptionsService(subscriptionsRepository)
const subscriptionCandidateService = new SubscriptionCandidateService(subscriptionsRepository, subscriptionsService)

const transactionsService = new TransactionsService(repository, {
  onTransactionCreated: (transaction) => {
    try { subscriptionCandidateService.detectCandidates(transaction) } catch { /* fire-and-forget: no rompe el alta */ }
  },
  onTransactionDeleted: (subscriptionId) => {
    if (!subscriptionId) return
    try { subscriptionsService.recalculateNextPaymentDate(subscriptionId) } catch { /* fire-and-forget */ }
  }
})
const storesService = new StoresService(createStoresRepository(db))

const transactionsController = new TransactionsController({
  transactionsService,
  storesService,
  loggerHandler: loggerHandler('TransactionController')
})

transactionsRoutes.post('/', authMiddleware, transactionsController.create.bind(transactionsController))
transactionsRoutes.get('/', authMiddleware, transactionsController.transactions.bind(transactionsController))
transactionsRoutes.put('/:id', authMiddleware, transactionsController.edit.bind(transactionsController))
transactionsRoutes.delete('/:id', authMiddleware, transactionsController.delete.bind(transactionsController))
