import { Router } from 'express'

import loggerHandler from '../utils/logger'
import { dashboardService } from '../services'
import authMiddleware from '../middlewares/auth.middleware'
import { DashboardController } from '../controllers/dashboard.controller'

export class DashboardRoutes {
  router: Router

  private dashboardController: DashboardController = new DashboardController({
    dashboardService,
    loggerHandler: loggerHandler('DashboardController')
  })

  constructor () {
    this.router = Router()
    this.routes()
  }

  routes () {
    this.router.get(
      '/stats',
      authMiddleware,
      this.dashboardController.stats.bind(this.dashboardController)
    )
  }
}
