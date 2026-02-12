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
    this.logger.logInfo('Health check')
    res.status(200).send({ status: 'ok' })
  }
}
