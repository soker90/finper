import { NextFunction, Request, Response } from 'express'

import { IStoreService } from '../services/stores.service'

import '../auth/local-strategy-passport-handler'

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

  public async stores (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.user as string)
      .tap(() => this.logger.logInfo(`/stores - list stores of ${req.user}`))
      .then(this.storeService.getStores.bind(this.storeService))
      .then(response => {
        res.send(response)
      }).catch(error => {
        next(error)
      })
  }
}
