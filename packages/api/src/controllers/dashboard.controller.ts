import { NextFunction, Request, Response } from 'express'

import '../auth/local-strategy-passport-handler'
import { IDashboardService } from '../services/dashboard'

type IDashboardController = {
  loggerHandler: any
  dashboardService: IDashboardService
}

export class DashboardController {
  private logger
  private dashboardService

  constructor ({ loggerHandler, dashboardService }: IDashboardController) {
    this.logger = loggerHandler
    this.dashboardService = dashboardService
  }

  public async stats (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve({ user: req.user as string })
      .tap(() => this.logger.logInfo(`/stats - dashboard stats for ${req.user}`))
      .then(this.dashboardService.getStats.bind(this.dashboardService))
      .then(response => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }
}
