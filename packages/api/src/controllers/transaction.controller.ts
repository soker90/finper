import { NextFunction, Request, Response } from 'express'

import '../auth/local-strategy-passport-handler'
import { ITransactionService } from '../services/transaction.service'
import extractUser from '../helpers/extract-user'
import { validateTransactionCreateParams } from '../validators/transaction'

type ITransactionController = {
    loggerHandler: any,
    transactionService: ITransactionService,
}

export class TransactionController {
  private logger

  private transactionService

  constructor ({ loggerHandler, transactionService }: ITransactionController) {
    this.logger = loggerHandler
    this.transactionService = transactionService
  }

  public async create (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.body)
      .tap(() => this.logger.logInfo('/create - new transaction'))
      .then(extractUser(req))
      .then(validateTransactionCreateParams)
      .then(this.transactionService.addTransaction.bind(this.transactionService))
      .tap(({ _id }) => this.logger.logInfo(`Transaction ${_id} has been succesfully created`))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }
}
