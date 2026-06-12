import { Request, Response } from 'express'
import { TransactionsService } from './transactions.service'
import { StoresService } from '../stores/stores.service'
import {
  validateTransactionCreateParams,
  validateTransactionEditParams,
  validateTransactionGetParams,
  validateTransactionExist
} from './transactions.validators'

export class TransactionsController {
  private logger
  private transactionsService: TransactionsService
  private storesService: StoresService

  constructor ({ loggerHandler, transactionsService, storesService }: { loggerHandler: any, transactionsService: TransactionsService, storesService: StoresService }) {
    this.logger = loggerHandler
    this.transactionsService = transactionsService
    this.storesService = storesService
  }

  public create (req: Request, res: Response): void {
    this.logger.logInfo('/create - new transaction')

    const params = validateTransactionCreateParams({ ...req.body, user: req.user })
    const withStore = this.storesService.getAndReplaceStore(params)
    const response = this.transactionsService.addTransaction(withStore)

    this.logger.logInfo(`Transaction ${response._id} has been succesfully created`)
    res.send(response)
  }

  public transactions (req: Request, res: Response): void {
    this.logger.logInfo(`/transactions - list transactions of ${req.user}`)

    const filters = validateTransactionGetParams(req.query as Record<string, any>)
    const response = this.transactionsService.getTransactions({ ...filters, user: req.user })

    res.send(response)
  }

  public edit (req: Request, res: Response): void {
    this.logger.logInfo(`/edit - transaction: ${req.params.id}`)

    const params = validateTransactionEditParams({ params: req.params, body: req.body, user: req.user })
    const withStore = this.storesService.replaceShopValue(params)
    const response = this.transactionsService.editTransaction(withStore)

    this.logger.logInfo(`Transaction ${response._id} has been succesfully edited`)
    res.send(response)
  }

  public delete (req: Request, res: Response): void {
    const { id } = req.params
    this.logger.logInfo(`/delete - transaction: ${id}`)

    validateTransactionExist(id, req.user)
    this.transactionsService.deleteTransaction(id, req.user)

    res.status(204).send()
  }
}
