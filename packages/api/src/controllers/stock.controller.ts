import { Request, Response } from 'express'

import { IStockService } from '../services/stock.service'
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

  public async summary (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/stocks/summary - summary of ${req.user}`)

    const response = await this.stockService.getStocksSummary(req.user)

    res.send(response)
  }

  public async stocks (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/stocks - list positions of ${req.user}`)

    const response = await this.stockService.getStocks(req.user)

    res.send(response)
  }

  public async create (req: Request, res: Response): Promise<void> {
    this.logger.logInfo('/create - stock')

    const params = await validateStockCreateParams(req.body)
    const response = await this.stockService.addStock({ ...params, user: req.user })
    this.logger.logInfo(`Stock ${response.ticker} has been successfully created`)

    res.send(response)
  }

  public async remove (req: Request, res: Response): Promise<void> {
    this.logger.logInfo('/delete - stock')

    await this.stockService.deleteStock(req.params.id, req.user)
    this.logger.logInfo('Stock has been successfully deleted')

    res.sendStatus(204)
  }
}
