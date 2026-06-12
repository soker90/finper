import { Request, Response } from 'express'
import { IGoalService } from './goals.service'
import {
  validateGoalCreateParams,
  validateGoalEditParams,
  validateGoalExist,
  validateGoalFundParams
} from './goals.validators'
import { goalsSerializer } from './goals.serializer'

export class GoalController {
  private logger
  private goalService

  constructor ({ loggerHandler, goalService }: { loggerHandler: any, goalService: IGoalService }) {
    this.logger = loggerHandler
    this.goalService = goalService
  }

  public create (req: Request, res: Response): void {
    const { name } = req.body
    this.logger.logInfo(`/create - goal: ${name}`)

    const params = validateGoalCreateParams({ ...req.body, user: req.user })
    const response = this.goalService.addGoal(req.user, params)
    this.logger.logInfo(`Goal ${response.name} has been successfully created`)

    res.status(201).send(goalsSerializer.toJson(response))
  }

  public goals (req: Request, res: Response): void {
    this.logger.logInfo(`/goals - list goals of ${req.user}`)

    const response = this.goalService.getGoals(req.user)

    res.send(response.map((r: any) => goalsSerializer.toJson(r)))
  }

  public goal (req: Request, res: Response): void {
    const { id } = req.params
    this.logger.logInfo(`/goal - get goal: ${id}`)

    validateGoalExist({ id, user: req.user })
    const response = this.goalService.getGoal({ id, user: req.user })

    if (response) {
      res.send(goalsSerializer.toJson(response))
    }
  }

  public edit (req: Request, res: Response): void {
    this.logger.logInfo(`/edit - goal: ${req.params.id}`)

    const { id, user, value } = validateGoalEditParams({ params: req.params, body: req.body, user: req.user })
    const response = this.goalService.editGoal({ id, user, value })
    this.logger.logInfo(`Goal ${response.id} has been successfully edited`)

    res.send(goalsSerializer.toJson(response))
  }

  public delete (req: Request, res: Response): void {
    const { id } = req.params
    this.logger.logInfo(`/delete - goal: ${id}`)

    validateGoalExist({ id, user: req.user })
    this.goalService.deleteGoal({ id, user: req.user })

    res.status(204).send()
  }

  public fund (req: Request, res: Response): void {
    this.logger.logInfo(`/fund - goal: ${req.params.id}`)

    const { id, user, amount } = validateGoalFundParams({ params: req.params, body: req.body, user: req.user })
    const response = this.goalService.fundGoal({ id, user, amount })

    res.send(goalsSerializer.toJson(response))
  }

  public withdraw (req: Request, res: Response): void {
    this.logger.logInfo(`/withdraw - goal: ${req.params.id}`)

    const { id, user, amount } = validateGoalFundParams({ params: req.params, body: req.body, user: req.user })
    const response = this.goalService.withdrawGoal({ id, user, amount })

    res.send(goalsSerializer.toJson(response))
  }
}
