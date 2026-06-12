import { Router } from 'express'
import loggerHandler from '../../utils/logger'
import authMiddleware from '../../middlewares/auth.middleware'
import { db } from '../../db'
import { createBudgetsRepository } from './budgets.repository'
import { BudgetsService } from './budgets.service'
import { BudgetsController } from './budgets.controller'

export const budgetsRoutes = Router()

const repository = createBudgetsRepository(db)
const budgetsService = new BudgetsService(repository)
const c = new BudgetsController({ budgetsService, loggerHandler: loggerHandler('BudgetController') })

budgetsRoutes.get('/', authMiddleware, c.budgets.bind(c))
budgetsRoutes.patch('/:category/:year/:month', authMiddleware, c.edit.bind(c))
budgetsRoutes.post('/', authMiddleware, c.copy.bind(c))
