import { Router } from 'express'

import loggerHandler from '../utils/logger'
import { storeService } from '../services'
import authMiddleware from '../middlewares/auth.middleware'
import { StoreController } from '../controllers/store.controller'

export class StoreRoutes {
  router: Router

  public storeController: StoreController = new StoreController({
    storeService,
    loggerHandler: loggerHandler('StoreController')
  })

  constructor () {
    this.router = Router()
    this.routes()
  }

  routes () {
    this.router.get(
      '/',
      authMiddleware,
      this.storeController.stores.bind(this.storeController)
    )
  }
}
