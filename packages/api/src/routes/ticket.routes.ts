import { Router } from 'express'

import loggerHandler from '../utils/logger'
import { ticketService } from '../services'
import authMiddleware from '../middlewares/auth.middleware'
import { TicketController } from '../controllers/ticket.controller'

export class TicketRoutes {
  router: Router

  public ticketController: TicketController = new TicketController({
    ticketService,
    loggerHandler: loggerHandler('TicketController')
  })

  constructor () {
    this.router = Router()
    this.routes()
  }

  routes () {
    this.router.get(
      '/',
      authMiddleware,
      this.ticketController.list.bind(this.ticketController)
    )

    this.router.patch(
      '/:id',
      authMiddleware,
      this.ticketController.review.bind(this.ticketController)
    )

    this.router.delete(
      '/:id',
      authMiddleware,
      this.ticketController.destroy.bind(this.ticketController)
    )
  }
}
