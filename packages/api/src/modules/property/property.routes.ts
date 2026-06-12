import { Router } from 'express'

import loggerHandler from '../../utils/logger'
import { PropertyController } from './property.controller'
import PropertyService from './property.service'
import authMiddleware from '../../middlewares/auth.middleware'

const propertyService = new PropertyService()

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

    this.router.put(
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
