import { Router } from 'express'

import loggerHandler from '../../utils/logger'
import { SupplyReadingController } from './supply-reading.controller'
import SupplyReadingService from './supply-reading.service'
import authMiddleware from '../../middlewares/auth.middleware'

const supplyReadingService = new SupplyReadingService()

export class SupplyReadingRoutes {
  router: Router

  private supplyReadingController: SupplyReadingController = new SupplyReadingController({
    supplyReadingService,
    loggerHandler: loggerHandler('SupplyReadingController')
  })

  constructor () {
    this.router = Router()
    this.routes()
  }

  routes () {
    this.router.get(
      '/supply/:supplyId',
      authMiddleware,
      this.supplyReadingController.getReadings.bind(this.supplyReadingController)
    )

    this.router.post(
      '/',
      authMiddleware,
      this.supplyReadingController.create.bind(this.supplyReadingController)
    )

    this.router.put(
      '/:id',
      authMiddleware,
      this.supplyReadingController.edit.bind(this.supplyReadingController)
    )

    this.router.delete(
      '/:id',
      authMiddleware,
      this.supplyReadingController.delete.bind(this.supplyReadingController)
    )
  }
}
