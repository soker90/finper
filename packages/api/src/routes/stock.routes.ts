import { Router } from 'express'

import loggerHandler from '../utils/logger'
import { StockController } from '../controllers/stock.controller'
import { stockService } from '../services'
import authMiddleware from '../middlewares/auth.middleware'

export class StockRoutes {
  router: Router

  private stockController: StockController = new StockController({
    stockService,
    loggerHandler: loggerHandler('StockController')
  })

  constructor () {
    this.router = Router()
    this.routes()
  }

  routes () {
    this.router.get(
      '/summary',
      authMiddleware,
      this.stockController.summary.bind(this.stockController)
    )

    this.router.get(
      '/',
      authMiddleware,
      this.stockController.stocks.bind(this.stockController)
    )

    this.router.post(
      '/',
      authMiddleware,
      this.stockController.create.bind(this.stockController)
    )

    this.router.delete(
      '/:id',
      authMiddleware,
      this.stockController.remove.bind(this.stockController)
    )
  }
}
