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

subscriptionsRoutes.post('/', authMiddleware, subscriptionsController.create.bind(subscriptionsController))
subscriptionsRoutes.get('/', authMiddleware, subscriptionsController.list.bind(subscriptionsController))
subscriptionsRoutes.put('/:id', authMiddleware, subscriptionsController.edit.bind(subscriptionsController))
subscriptionsRoutes.delete('/:id', authMiddleware, subscriptionsController.delete.bind(subscriptionsController))
