import { Request, Response } from 'express'
import { StoresService } from './stores.service'

export class StoresController {
  private logger
  private storesService: StoresService

  constructor ({ loggerHandler, storesService }: { loggerHandler: any, storesService: StoresService }) {
    this.logger = loggerHandler
    this.storesService = storesService
  }

  public stores (req: Request, res: Response): void {
    this.logger.logInfo(`/stores - list stores of ${req.user}`)
    const response = this.storesService.getStores(req.user)
    res.send(response)
  }
}
