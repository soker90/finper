import { Router } from 'express'

import loggerHandler from '../utils/logger'
import { PropertyController } from '../controllers/property.controller'
import { propertyService } from '../services'
import authMiddleware from '../middlewares/auth.middleware'

export class PropertyRoutes {
  router: Router

  private propertyController: PropertyController = new PropertyController({
    propertyService,
    loggerHandler: loggerHandler('PropertyController')
  })

  constructor () {
    this.router = Router()
    this.routes()
  }

  routes () {
    this.router.post(
      '/',
      authMiddleware,
      this.propertyController.create.bind(this.propertyController)
    )

    this.router.patch(
      '/:id',
      authMiddleware,
      this.propertyController.edit.bind(this.propertyController)
    )

    this.router.delete(
      '/:id',
      authMiddleware,
      this.propertyController.delete.bind(this.propertyController)
    )
  }
}
