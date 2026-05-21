import { NextFunction, Request, Response } from 'express'

import '../auth/local-strategy-passport-handler'
import { IStockService } from '../services/stock.service'
import extractUser from '../helpers/extract-user'
import { validateStockCreateParams } from '../validators/stock'

type IStockController = {
  loggerHandler: any,
  stockService: IStockService,
}

export class StockController {
  private logger

  private stockService

  constructor ({ loggerHandler, stockService }: IStockController) {
    this.logger = loggerHandler
    this.stockService = stockService
  }

  public async summary (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.user as string)
      .tap((user: string) => this.logger.logInfo(`/stocks/summary - summary of ${user}`))
      .then(this.stockService.getStocksSummary.bind(this.stockService))
      .then(response => { res.send(response) })
      .catch(error => { next(error) })
  }

  public async stocks (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.user as string)
      .tap((user: string) => this.logger.logInfo(`/stocks - list positions of ${user}`))
      .then(this.stockService.getStocks.bind(this.stockService))
      .then(response => {
        res.send(response)
      })
      .catch(error => {
        next(error)
      })
  }

  public async create (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.body)
      .tap(() => this.logger.logInfo('/create - stock'))
      .then(validateStockCreateParams)
      .then(extractUser(req))
      .then(this.stockService.addStock.bind(this.stockService))
      .tap(({ ticker }) => this.logger.logInfo(`Stock ${ticker} has been successfully created`))
      .then(response => {
        res.send(response)
      })
      .catch(error => {
        next(error)
      })
  }

  public async remove (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.params.id)
      .tap(() => this.logger.logInfo('/delete - stock'))
      .then(id => this.stockService.deleteStock(id, req.user as string))
      .tap(() => this.logger.logInfo('Stock has been successfully deleted'))
      .then(() => {
        res.sendStatus(204)
      })
      .catch(error => {
        next(error)
      })
  }
}
