import { Request, Response } from 'express'
import { DashboardService } from './dashboard.service'

export class DashboardController {
  private logger
  private dashboardService: DashboardService

  constructor ({ loggerHandler, dashboardService }: { loggerHandler: any, dashboardService: DashboardService }) {
    this.logger = loggerHandler
    this.dashboardService = dashboardService
  }

  public stats (req: Request, res: Response): void {
    this.logger.logInfo(`/stats - dashboard stats for ${req.user}`)
    const response = this.dashboardService.getStats({ user: req.user })
    res.send(response)
  }
}
