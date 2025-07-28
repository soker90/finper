import { Request, Response } from 'express'

type IMonitController = {
  loggerHandler: any,
}

export class MonitController {
  private logger

  constructor ({ loggerHandler }: IMonitController) {
    this.logger = loggerHandler
  }

  public getHealthStatus (req: Request, res: Response): void {
    Promise.resolve()
      .tap(() => this.logger.logInfo('Testing'))
      .then(() => res.status(204).send())
  }
}
