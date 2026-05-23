import { Request, Response } from 'express'

import { IStatsService } from '../services/stats.service'
import { validateStatsYearParam } from '../validators/stats'

type IStatsController = {
  loggerHandler: any,
  statsService: IStatsService,
}

export class StatsController {
  private logger
  private statsService

  constructor ({ loggerHandler, statsService }: IStatsController) {
    this.logger = loggerHandler
    this.statsService = statsService
  }

  public async getAvailableTags (req: Request, res: Response): Promise<void> {
    this.logger.logInfo('/tags/available - list available tags')

    const response = await this.statsService.getAvailableTags(req.user)

    res.send(response)
  }

  public async getAvailableYears (req: Request, res: Response): Promise<void> {
    this.logger.logInfo('/tags/years - list available years')

    const response = await this.statsService.getAvailableYears(req.user)

    res.send(response)
  }

  public async getTagsSummary (req: Request, res: Response): Promise<void> {
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear()
    this.logger.logInfo('/tags - list tags summary')

    const response = await this.statsService.getTagsSummary(req.user, year)

    res.send(response)
  }

  public async getTagHistoric (req: Request, res: Response): Promise<void> {
    const { tagName } = req.params
    this.logger.logInfo(`/tags/${tagName} - get tag historic`)

    const response = await this.statsService.getTagHistoric(req.user, tagName)

    res.send(response)
  }

  public async getTagDetail (req: Request, res: Response): Promise<void> {
    const { tagName, year: yearParam } = req.params
    const year = Number(yearParam)
    validateStatsYearParam(year)
    this.logger.logInfo(`/tags/${tagName}/${year} - get tag detail`)

    const response = await this.statsService.getTagDetail(req.user, tagName, year)

    res.send(response)
  }
}
