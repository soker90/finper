import { Router } from 'express'
import loggerHandler from '../../utils/logger'
import authMiddleware from '../../middlewares/auth.middleware'
import { db } from '../../db'
import { createLoansRepository } from './loans.repository'
import { LoansService } from './loans.service'
import { LoansController } from './loans.controller'

export const loansRoutes = Router()

const repository = createLoansRepository(db)
const loansService = new LoansService(repository)
const c = new LoansController({ loansService, loggerHandler: loggerHandler('LoanController') })

loansRoutes.get('/', authMiddleware, c.list.bind(c))
loansRoutes.post('/', authMiddleware, c.create.bind(c))
loansRoutes.get('/:id', authMiddleware, c.detail.bind(c))
loansRoutes.put('/:id', authMiddleware, c.edit.bind(c))
loansRoutes.delete('/:id', authMiddleware, c.remove.bind(c))
