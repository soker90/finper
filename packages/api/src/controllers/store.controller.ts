import { Request, Response } from 'express'

import { IStoreService } from '../services/stores.service'

type IStoreController = {
  loggerHandler: any,
  storeService: IStoreService,
}

export class StoreController {
  private logger

  private storeService

  constructor ({ loggerHandler, storeService }: IStoreController) {
    this.logger = loggerHandler
    this.storeService = storeService
  }

  public async stores (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/stores - list stores of ${req.user}`)

    const response = await this.storeService.getStores(req.user)

    res.send(response)
  }
}
