import { Router } from 'express'

import loggerHandler from '../utils/logger'
import { PensionController } from '../controllers/pension.controller'
import { pensionService } from '../services'
import authMiddleware from '../middlewares/auth.middleware'

export class PensionRoutes {
  router: Router

  public pensionController: PensionController = new PensionController({
    pensionService,
    loggerHandler: loggerHandler('PensionController')
  })

  constructor () {
    this.router = Router()
    this.routes()
  }

  routes () {
    this.router.post(
      '/',
      authMiddleware,
      this.pensionController.create.bind(this.pensionController)
    )

    this.router.get(
      '/',
      authMiddleware,
      this.pensionController.pensions.bind(this.pensionController)
    )
  }
}
