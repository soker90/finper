import { Router } from 'express'

import { MonitController } from '../controllers/monit.controller'
import loggerHandler from '../utils/logger'

export class MonitRoutes {
  router: Router

  public monitController: MonitController = new MonitController({
    loggerHandler: loggerHandler('MonitController')
  })

  constructor () {
    this.router = Router()
    this.routes()
  }

  routes () {
    this.router.get('/health',
      this.monitController.getHealthStatus.bind(this.monitController))
  }
}
