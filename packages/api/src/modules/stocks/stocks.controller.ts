import { Request, Response } from 'express'
import { IStockService } from './stocks.service'
import { validateStockCreateParams } from './stocks.validators'
import { serializeStock, serializeStockPosition } from './stocks.serializer'
import loggerHandler from '../../utils/logger'

export class StockController {
  private logger = loggerHandler('StockController')

  constructor (private readonly stockService: IStockService) {}

  public async summary (req: Request, res: Response): Promise<void> {
    const username = req.user as string
    this.logger.logInfo(`/stocks/summary - summary of ${username}`)

    const response = await this.stockService.getStocksSummary(username)

    res.send(response)
  }

  public async stocks (req: Request, res: Response) {
    const username = req.user as string
    this.logger.logInfo(`/stocks - list positions of ${username}`)

    const response = await this.stockService.getStocks(username)

    res.send(response.map(serializeStockPosition))
  }

  public create (req: Request, res: Response): void {
    const username = req.user as string
    this.logger.logInfo('/create - stock')

    const params = validateStockCreateParams(req.body)
    const response = this.stockService.addStock({ ...params, user: username, date: new Date(params.date) })
    this.logger.logInfo(`Stock ${response.ticker} has been successfully created`)

    res.send(serializeStock(response))
  }

  public remove (req: Request, res: Response): void {
    const username = req.user as string
    this.logger.logInfo('/delete - stock')

    this.stockService.deleteStock(req.params.id, username)
    this.logger.logInfo('Stock has been successfully deleted')

    res.sendStatus(204)
  }
}
