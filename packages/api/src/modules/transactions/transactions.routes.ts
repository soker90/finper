import { Router } from 'express'
import loggerHandler from '../../utils/logger'
import authMiddleware from '../../middlewares/auth.middleware'
import { db } from '../../db'
import { createTransactionsRepository } from './transactions.repository'
import { TransactionsService } from './transactions.service'
import { TransactionsController } from './transactions.controller'
import { createStoresRepository } from '../stores/stores.repository'
import { StoresService } from '../stores/stores.service'

export const transactionsRoutes = Router()

const repository = createTransactionsRepository(db)
const transactionsService = new TransactionsService(repository)
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
