import { NextFunction, Request, Response } from 'express'

import { IWealthService } from '../services/wealth.service'
import { validateFireProjectionParams } from '../validators/wealth'

type IWealthController = {
  loggerHandler: any
  wealthService: IWealthService
}

export class WealthController {
  private logger
  private wealthService

  constructor ({ loggerHandler, wealthService }: IWealthController) {
    this.logger = loggerHandler
    this.wealthService = wealthService
  }

  public async getFireProjection (req: Request, res: Response, next: NextFunction): Promise<void> {
    const user = req.user as string
    Promise.resolve({ ...req.query, user })
      .tap(() => this.logger.logInfo('/wealth/fire-projection - get fire projection'))
      .then(validateFireProjectionParams)
      .then((params) => this.wealthService.getFireProjection(params))
      .then((response) => res.send(response))
      .catch(next)
  }
}
