import { Request, Response } from 'express'

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

  public async stats (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/stats - dashboard stats for ${req.user}`)

    const response = await this.dashboardService.getStats({ user: req.user })

    res.send(response)
  }
}
