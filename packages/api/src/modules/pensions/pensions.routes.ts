import { Router } from 'express'
import loggerHandler from '../../utils/logger'
import authMiddleware from '../../middlewares/auth.middleware'
import { db } from '../../db'
import { createPensionsRepository } from './pensions.repository'
import { PensionsService } from './pensions.service'
import { PensionsController } from './pensions.controller'

export class PensionsRoutes {
  public router: Router

  private pensionsController: PensionsController

  constructor () {
    const repository = createPensionsRepository(db)
    const pensionsService = new PensionsService(repository)
    
    this.pensionsController = new PensionsController({
      pensionsService,
      loggerHandler: loggerHandler('PensionController')
    })

    this.router = Router()
    this.routes()
  }

  private routes () {
    this.router.post(
      '/',
      authMiddleware,
      this.pensionsController.create.bind(this.pensionsController)
    )

    this.router.get(
      '/',
      authMiddleware,
      this.pensionsController.pensions.bind(this.pensionsController)
    )

    this.router.put(
      '/:id',
      authMiddleware,
      this.pensionsController.edit.bind(this.pensionsController)
    )
  }
}
