import { NextFunction, Request, Response } from 'express'

import '../auth/local-strategy-passport-handler'
import { ITransactionService } from '../services/transaction.service'
import extractUser from '../helpers/extract-user'
import { validateTransactionCreateParams, validateTransactionGetParams } from '../validators/transaction'
import { IStoreService } from '../services/stores.service'

type ITransactionController = {
    loggerHandler: any,
    transactionService: ITransactionService,
    storeService: IStoreService,
}

export class TransactionController {
  private logger

  private transactionService
  private storeService

  constructor ({ loggerHandler, transactionService, storeService }: ITransactionController) {
    this.logger = loggerHandler
    this.transactionService = transactionService
    this.storeService = storeService
  }

  public async create (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.body)
      .tap(() => this.logger.logInfo('/create - new transaction'))
      .then(extractUser(req))
      .then(validateTransactionCreateParams)
      .then(this.storeService.getAndReplaceStore)
      .then(this.transactionService.addTransaction.bind(this.transactionService))
      .tap(({ _id }) => this.logger.logInfo(`Transaction ${_id} has been succesfully created`))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async transactions (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.params)
      .tap(() => this.logger.logInfo(`/transactions - list transactions of ${req.user}`))
      .then(validateTransactionGetParams)
      .then(extractUser(req))
      .then(this.transactionService.getTransactions.bind(this.transactionService))
      .then(response => {
        res.send(response)
      }).catch(error => {
        next(error)
      })
  }
}
