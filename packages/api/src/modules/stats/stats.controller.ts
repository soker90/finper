import { Request, Response } from 'express'
import { StatsService } from './stats.service'
import { validateStatsYearParam } from './stats.validators'

export class StatsController {
  private logger
  private statsService: StatsService

  constructor ({ loggerHandler, statsService }: { loggerHandler: any, statsService: StatsService }) {
    this.logger = loggerHandler
    this.statsService = statsService
  }

  public getAvailableTags (req: Request, res: Response): void {
    this.logger.logInfo(`/stats/tags/available - ${req.user}`)
    res.send(this.statsService.getAvailableTags(req.user as string))
  }

  public getAvailableYears (req: Request, res: Response): void {
    this.logger.logInfo(`/stats/tags/years - ${req.user}`)
    res.send(this.statsService.getAvailableYears(req.user as string))
  }

  public getTagsSummary (req: Request, res: Response): void {
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear()
    this.logger.logInfo(`/stats/tags - ${req.user} (${year})`)
    res.send(this.statsService.getTagsSummary(req.user as string, year))
  }

  public getTagHistoric (req: Request, res: Response): void {
    const { tagName } = req.params
    this.logger.logInfo(`/stats/tags/${tagName} - ${req.user}`)
    res.send(this.statsService.getTagHistoric(req.user as string, tagName))
  }

  public getTagDetail (req: Request, res: Response): void {
    const { tagName, year: yearParam } = req.params
    const year = Number(yearParam)
    validateStatsYearParam(year)
    this.logger.logInfo(`/stats/tags/${tagName}/${year} - ${req.user}`)
    res.send(this.statsService.getTagDetail(req.user as string, tagName, year))
  }
}
