import { Router } from 'express'
import loggerHandler from '../../utils/logger'
import authMiddleware from '../../middlewares/auth.middleware'
import { db } from '../../db'
import { createSubscriptionsRepository } from './subscriptions.repository'
import { SubscriptionsService } from './subscriptions.service'
import { SubscriptionsController } from './subscriptions.controller'

export const subscriptionsRoutes = Router()

const repository = createSubscriptionsRepository(db)
const subscriptionsService = new SubscriptionsService(repository)
const subscriptionsController = new SubscriptionsController({
  subscriptionsService,
  loggerHandler: loggerHandler('SubscriptionController')
})
const c = subscriptionsController

subscriptionsRoutes.post('/', authMiddleware, c.create.bind(c))
subscriptionsRoutes.get('/', authMiddleware, c.list.bind(c))

// Parte B: específicas /:id/... antes que las genéricas /:id
subscriptionsRoutes.get('/:id/transactions', authMiddleware, c.getTransactions.bind(c))
subscriptionsRoutes.get('/:id/matching-transactions', authMiddleware, c.getMatchingTransactions.bind(c))
subscriptionsRoutes.post('/:id/link-transactions', authMiddleware, c.linkTransactions.bind(c))
subscriptionsRoutes.delete('/:id/unlink-transactions/:transactionId', authMiddleware, c.unlinkTransaction.bind(c))

subscriptionsRoutes.put('/:id', authMiddleware, c.edit.bind(c))
subscriptionsRoutes.delete('/:id', authMiddleware, c.delete.bind(c))
