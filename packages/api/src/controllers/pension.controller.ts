import { NextFunction, Request, Response } from 'express'

import '../auth/local-strategy-passport-handler'
import { IPensionService } from '../services/pension.service'

type IPensionController = {
    loggerHandler: any,
    pensionService: IPensionService,
}

export class PensionController {
  private logger

  private pensionService

  constructor ({ loggerHandler, pensionService }: IPensionController) {
    this.logger = loggerHandler
    this.pensionService = pensionService
  }

  public async pensions (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.user as string)
      .tap((user: string) => this.logger.logInfo(`/pensions - list pension transactions of ${user}`))
      .then(this.pensionService.getPensions.bind(this.pensionService))
      .then(response => {
        res.send(response)
      }).catch(error => {
        next(error)
      })
  }
}
