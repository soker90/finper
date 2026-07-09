import { Router } from 'express'
import loggerHandler from '../../utils/logger'
import authMiddleware from '../../middlewares/auth.middleware'
import { db } from '../../db'
import { createYieldsRepository } from './yields.repository'
import { YieldsService } from './yields.service'
import { YieldsController } from './yields.controller'

export const yieldsRoutes = Router()

const repository = createYieldsRepository(db)
const yieldsService = new YieldsService(repository)
const yieldsController = new YieldsController({
  yieldsService,
  loggerHandler: loggerHandler('YieldsController')
})
const c = yieldsController

yieldsRoutes.post('/', authMiddleware, c.create.bind(c))
yieldsRoutes.get('/', authMiddleware, c.list.bind(c))

// Específicas /:id/... antes que las genéricas /:id
yieldsRoutes.get('/:id/matching-transactions', authMiddleware, c.getMatchingTransactions.bind(c))
yieldsRoutes.post('/:id/link-transactions', authMiddleware, c.linkTransactions.bind(c))
yieldsRoutes.delete('/:id/unlink-transactions/:transactionId', authMiddleware, c.unlinkTransaction.bind(c))

// Genéricas /:id
yieldsRoutes.get('/:id', authMiddleware, c.detail.bind(c))
yieldsRoutes.put('/:id', authMiddleware, c.edit.bind(c))
yieldsRoutes.delete('/:id', authMiddleware, c.delete.bind(c))
