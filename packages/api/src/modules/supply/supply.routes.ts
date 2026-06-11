import { Router } from 'express'

import loggerHandler from '../../utils/logger'
import { SupplyController } from './supply.controller'
import SupplyService from './supply.service'
import TariffsService from './tariffs.service'
import authMiddleware from '../../middlewares/auth.middleware'

const supplyService = new SupplyService()
const tariffsService = new TariffsService()

export class SupplyRoutes {
  router: Router

  private supplyController: SupplyController = new SupplyController({
    supplyService,
    tariffsService,
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

    this.router.get(
      '/:id/tariffs-comparison',
      authMiddleware,
      this.supplyController.compareTariffs.bind(this.supplyController)
    )

    this.router.delete(
      '/:id',
      authMiddleware,
      this.supplyController.delete.bind(this.supplyController)
    )
  }
}
