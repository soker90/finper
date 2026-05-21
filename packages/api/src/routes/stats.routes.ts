import { Router } from 'express'

import loggerHandler from '../utils/logger'
import { statsService } from '../services'
import authMiddleware from '../middlewares/auth.middleware'
import { StatsController } from '../controllers/stats.controller'

export class StatsRoutes {
  router: Router

  private statsController: StatsController = new StatsController({
    statsService,
    loggerHandler: loggerHandler('StatsController')
  })

  constructor () {
    this.router = Router()
    this.routes()
  }

  routes () {
    this.router.get(
      '/tags/available',
      authMiddleware,
      this.statsController.getAvailableTags.bind(this.statsController)
    )

    this.router.get(
      '/tags/years',
      authMiddleware,
      this.statsController.getAvailableYears.bind(this.statsController)
    )

    this.router.get(
      '/tags',
      authMiddleware,
      this.statsController.getTagsSummary.bind(this.statsController)
    )

    this.router.get(
      '/tags/:tagName',
      authMiddleware,
      this.statsController.getTagHistoric.bind(this.statsController)
    )

    this.router.get(
      '/tags/:tagName/:year',
      authMiddleware,
      this.statsController.getTagDetail.bind(this.statsController)
    )
  }
}
