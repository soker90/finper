import { NextFunction, Request, Response } from 'express'

import '../auth/local-strategy-passport-handler'
import { IStatsService } from '../services/stats.service'

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

  public async getAvailableTags (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.user as string)
      .tap(() => this.logger.logInfo('/tags/available - list available tags'))
      .then(this.statsService.getAvailableTags.bind(this.statsService))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async getAvailableYears (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.user as string)
      .tap(() => this.logger.logInfo('/tags/years - list available years'))
      .then(this.statsService.getAvailableYears.bind(this.statsService))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async getTagsSummary (req: Request, res: Response, next: NextFunction): Promise<void> {
    const user = req.user as string
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear()

    Promise.resolve(user)
      .tap(() => this.logger.logInfo('/tags - list tags summary'))
      .then((u) => this.statsService.getTagsSummary(u, year))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async getTagHistoric (req: Request, res: Response, next: NextFunction): Promise<void> {
    const user = req.user as string
    const tagName = req.params.tagName

    Promise.resolve(user)
      .tap(() => this.logger.logInfo(`/tags/${tagName} - get tag historic`))
      .then((u) => this.statsService.getTagHistoric(u, tagName))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async getTagDetail (req: Request, res: Response, next: NextFunction): Promise<void> {
    const user = req.user as string
    const tagName = req.params.tagName
    const year = Number(req.params.year)

    Promise.resolve(user)
      .tap(() => this.logger.logInfo(`/tags/${tagName}/${year} - get tag detail`))
      .then((u) => this.statsService.getTagDetail(u, tagName, year))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }
}
