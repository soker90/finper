import { Request, Response } from 'express'

import { IGoalService } from '../services/goal.service'
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

  public async create (req: Request, res: Response): Promise<void> {
    const { name } = req.body
    this.logger.logInfo(`/create - goal: ${name}`)

    const params = await validateGoalCreateParams({ ...req.body, user: req.user })
    const response = await this.goalService.addGoal(params)
    this.logger.logInfo(`Goal ${response.name} has been successfully created`)

    res.send(response)
  }

  public async goals (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/goals - list goals of ${req.user}`)

    const response = await this.goalService.getGoals(req.user)

    res.send(response)
  }

  public async goal (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/goal - get goal: ${id}`)

    await validateGoalExist({ id, user: req.user })
    const response = await this.goalService.getGoal({ id, user: req.user })

    res.send(response)
  }

  public async edit (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/edit - goal: ${req.params.id}`)

    const { id, user, value } = await validateGoalEditParams({ params: req.params, body: req.body, user: req.user })
    const response = await this.goalService.editGoal({ id, user, value })
    this.logger.logInfo(`Goal ${response._id} has been successfully edited`)

    res.send(response)
  }

  public async delete (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/delete - goal: ${id}`)

    await validateGoalExist({ id, user: req.user })
    await this.goalService.deleteGoal({ id, user: req.user })

    res.status(204).send()
  }

  public async fund (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/fund - goal: ${req.params.id}`)

    const { id, user, amount } = await validateGoalFundParams({ params: req.params, body: req.body, user: req.user })
    const response = await this.goalService.fundGoal({ id, user, amount })

    res.send(response)
  }

  public async withdraw (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/withdraw - goal: ${req.params.id}`)

    const { id, user, amount } = await validateGoalFundParams({ params: req.params, body: req.body, user: req.user })
    const response = await this.goalService.withdrawGoal({ id, user, amount })

    res.send(response)
  }
}
