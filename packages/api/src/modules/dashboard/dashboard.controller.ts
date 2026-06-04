import { Request, Response } from 'express'
import { DashboardService } from './dashboard.service'

export class DashboardController {
  private logger
  private dashboardService: DashboardService

  constructor ({ loggerHandler, dashboardService }: { loggerHandler: any, dashboardService: DashboardService }) {
    this.logger = loggerHandler
    this.dashboardService = dashboardService
  }

  public async stats (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/stats - dashboard stats for ${req.user}`)
    const response = await this.dashboardService.getStats({ user: req.user as string })
    res.send(response)
  }
}
