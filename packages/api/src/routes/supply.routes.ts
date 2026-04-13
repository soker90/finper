import { Router } from 'express'

import loggerHandler from '../utils/logger'
import { SupplyController } from '../controllers/supply.controller'
import { supplyService } from '../services'
import authMiddleware from '../middlewares/auth.middleware'

export class SupplyRoutes {
  router: Router

  private supplyController: SupplyController = new SupplyController({
    supplyService,
    loggerHandler: loggerHandler('SupplyController')
  })

  constructor () {
    this.router = Router()
    this.routes()
  }

  routes () {
    this.router.get(
      '/',
      authMiddleware,
      this.supplyController.group.bind(this.supplyController)
    )

    this.router.post(
      '/',
      authMiddleware,
      this.supplyController.create.bind(this.supplyController)
    )

    this.router.put(
      '/:id',
      authMiddleware,
      this.supplyController.edit.bind(this.supplyController)
    )

    this.router.delete(
      '/:id',
      authMiddleware,
      this.supplyController.delete.bind(this.supplyController)
    )
  }
}
