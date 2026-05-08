import { Router } from 'express'

import loggerHandler from '../utils/logger'
import { wealthService } from '../services'
import authMiddleware from '../middlewares/auth.middleware'
import { WealthController } from '../controllers/wealth.controller'

export class WealthRoutes {
  router: Router

  private wealthController: WealthController = new WealthController({
    wealthService,
    loggerHandler: loggerHandler('WealthController')
  })

  constructor () {
    this.router = Router()
    this.routes()
  }

  routes () {
    this.router.get('/fire-projection', authMiddleware, this.wealthController.getFireProjection.bind(this.wealthController))
  }
}
