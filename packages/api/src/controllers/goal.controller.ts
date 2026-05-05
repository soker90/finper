import { NextFunction, Request, Response } from 'express'

import '../auth/local-strategy-passport-handler'
import extractUser from '../helpers/extract-user'
import { RequestUser } from '../types'
import { IGoalService } from '../services/goal.service'
import { GoalDocument } from '@soker90/finper-models'
import { validateGoalCreateParams, validateGoalEditParams, validateGoalExist, validateGoalFundParams } from '../validators/goal'

type IGoalController = {
  loggerHandler: any,
  goalService: IGoalService,
}

export class GoalController {
  private logger

  private goalService

  constructor ({ loggerHandler, goalService }: IGoalController) {
    this.logger = loggerHandler
    this.goalService = goalService
  }

  public async create (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.body)
      .tap(({ name }) => this.logger.logInfo(`/create - goal: ${name}`))
      .then(extractUser(req))
      .then(validateGoalCreateParams)
      .then(this.goalService.addGoal.bind(this.goalService))
      .tap(({ name }) => this.logger.logInfo(`Goal ${name} has been successfully created`))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async goals (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.user as string)
      .tap((user: string) => this.logger.logInfo(`/goals - list goals of ${user}`))
      .then(this.goalService.getGoals.bind(this.goalService))
      .then(response => {
        res.send(response)
      }).catch(error => {
        next(error)
      })
  }

  public async goal (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.params.id)
      .tap((id) => this.logger.logInfo(`/goal - get goal: ${id}`))
      .tap(validateGoalExist.bind(null, { id: req.params.id, user: req.user as string }))
      .then(this.goalService.getGoal.bind(this.goalService))
      .then(response => {
        res.send(response)
      }).catch(error => {
        next(error)
      })
  }

  public async edit (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req as RequestUser)
      .tap(({ params }) => this.logger.logInfo(`/edit - goal: ${params?.id}`))
      .then(validateGoalEditParams)
      .then(this.goalService.editGoal.bind(this.goalService))
      .tap(({ _id }: GoalDocument) => this.logger.logInfo(`Goal ${_id} has been successfully edited`))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async delete (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.params.id)
      .tap((id) => this.logger.logInfo(`/delete - goal: ${id}`))
      .tap(validateGoalExist.bind(null, { id: req.params.id, user: req.user as string }))
      .then(this.goalService.deleteGoal.bind(this.goalService))
      .then(() => {
        res.status(204).send()
      })
      .catch((error) => {
        next(error)
      })
  }

  public async fund (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req as RequestUser)
      .tap(({ params }) => this.logger.logInfo(`/fund - goal: ${params?.id}`))
      .then(validateGoalFundParams)
      .then(this.goalService.fundGoal.bind(this.goalService))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async withdraw (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req as RequestUser)
      .tap(({ params }) => this.logger.logInfo(`/withdraw - goal: ${params?.id}`))
      .then(validateGoalFundParams)
      .then(this.goalService.withdrawGoal.bind(this.goalService))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }
}
