import { Router } from 'express'
import loggerHandler from '../../utils/logger'
import authMiddleware from '../../middlewares/auth.middleware'
import { db } from '../../db'
import { createDashboardRepository } from './dashboard.repository'
import { DashboardService } from './dashboard.service'
import { DashboardController } from './dashboard.controller'

export const dashboardRoutes = Router()

const repository = createDashboardRepository(db)
const dashboardService = new DashboardService(repository)
const c = new DashboardController({ dashboardService, loggerHandler: loggerHandler('DashboardController') })

dashboardRoutes.get('/stats', authMiddleware, c.stats.bind(c))
