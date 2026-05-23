import { Request, Response } from 'express'

import '../auth/local-strategy-passport-handler'
import { ITransactionService } from '../services/transaction.service'
import {
  validateTransactionCreateParams,
  validateTransactionGetParams,
  validateTransactionEditParams,
  validateTransactionExist
} from '../validators/transaction'
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

  public async create (req: Request, res: Response): Promise<void> {
    this.logger.logInfo('/create - new transaction')

    const params = await validateTransactionCreateParams({ ...req.body, user: req.user })
    const withStore = await this.storeService.getAndReplaceStore(params)
    const response = await this.transactionService.addTransaction(withStore)

    this.logger.logInfo(`Transaction ${response._id} has been succesfully created`)
    res.send(response)
  }

  public async transactions (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/transactions - list transactions of ${req.user}`)

    const filters = await validateTransactionGetParams(req.query as Record<string, any>)
    const response = await this.transactionService.getTransactions({ ...filters, user: req.user })

    res.send(response)
  }

  public async edit (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/edit - transaction: ${req.params.id}`)

    const params = await validateTransactionEditParams({ params: req.params, body: req.body, user: req.user })
    const withStore = await this.storeService.replaceShopValue(params)
    const response = await this.transactionService.editTransaction(withStore)

    this.logger.logInfo(`Transaction ${response._id} has been succesfully edited`)
    res.send(response)
  }

  public async delete (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/delete - transaction: ${id}`)

    await validateTransactionExist(id, req.user)
    await this.transactionService.deleteTransaction(id)

    res.status(204).send()
  }
}
