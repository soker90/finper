import { Router } from 'express'

import loggerHandler from '../utils/logger'
import { loanService } from '../services'
import authMiddleware from '../middlewares/auth.middleware'
import { LoanController } from '../controllers/loan.controller'

export class LoanRoutes {
  router: Router

  public loanController: LoanController = new LoanController({
    loanService,
    loggerHandler: loggerHandler('LoanController')
  })

  constructor () {
    this.router = Router()
    this.routes()
  }

  routes () {
    this.router.get('/', authMiddleware, this.loanController.list.bind(this.loanController))
    this.router.post('/', authMiddleware, this.loanController.create.bind(this.loanController))
    this.router.get('/:id', authMiddleware, this.loanController.detail.bind(this.loanController))
    this.router.put('/:id', authMiddleware, this.loanController.edit.bind(this.loanController))
    this.router.delete('/:id', authMiddleware, this.loanController.remove.bind(this.loanController))
    this.router.post('/:id/pay', authMiddleware, this.loanController.payOrdinary.bind(this.loanController))
    this.router.post('/:id/amortize', authMiddleware, this.loanController.payExtraordinary.bind(this.loanController))
    this.router.post('/:id/events', authMiddleware, this.loanController.addEvent.bind(this.loanController))
    this.router.delete('/:id/payments/:paymentId', authMiddleware, this.loanController.deletePayment.bind(this.loanController))
    this.router.put('/:id/payments/:paymentId', authMiddleware, this.loanController.editPayment.bind(this.loanController))
    this.router.post('/:id/payments/import', authMiddleware, this.loanController.importPayment.bind(this.loanController))
  }
}
