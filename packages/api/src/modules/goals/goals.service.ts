import { AccountModel } from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { roundMoney } from '@soker90/finper-db'
import { ERROR_MESSAGE } from '../../i18n'
import type { GoalsRepository } from './goals.repository'
import { goalsRepository } from './goals.repository'

export interface IGoalService {
  addGoal(username: string, goal: Record<string, any>): Promise<any>
  editGoal({ id, user, value }: { id: string, user: string, value: Record<string, any> }): Promise<any>
  getGoals(user: string): Promise<any[]>
  getGoal({ id, user }: { id: string, user: string }): Promise<any>
  deleteGoal({ id, user }: { id: string, user: string }): Promise<void>
  fundGoal({ id, user, amount }: { id: string, user: string, amount: number }): Promise<any>
  withdrawGoal({ id, user, amount }: { id: string, user: string, amount: number }): Promise<any>
}

/**
 * TRANSITORIO: cruza Mongo (accounts) con SQLite (goals).
 * No es atómico, pero la app es de un solo usuario y la ventana
 * de race condition es ínfima. Cuando se migre `accounts` a SQLite
 * en una futura sesión, esta función pasará a ser una sola query
 * SQL con JOIN, y este comentario debe eliminarse.
 */
const validateTotalAllocation = async (
  repo: GoalsRepository,
  username: string,
  newAllocation: number,
  excludeGoalId?: string
): Promise<void> => {
  const [accountBalance, otherGoalsTotal] = await Promise.all([
    AccountModel.aggregate([
      { $match: { user: username, isActive: true } },
      { $group: { _id: null, total: { $sum: '$balance' } } }
    ]).then(r => r[0]?.total ?? 0),
    Promise.resolve(repo.getTotalAllocatedByUser(username, excludeGoalId))
  ])

  const totalAfter = roundMoney(otherGoalsTotal + newAllocation)
  if (totalAfter > roundMoney(accountBalance)) {
    throw Boom.badRequest(ERROR_MESSAGE.GOAL.EXCEEDS_BALANCE).output
  }
}

export class GoalService implements IGoalService {
  constructor (private repo: GoalsRepository = goalsRepository) {}

  public async addGoal (username: string, goal: Record<string, any>): Promise<any> {
    const currentAmount = goal.currentAmount ?? 0
    if (currentAmount > 0) {
      await validateTotalAllocation(this.repo, username, currentAmount)
    }
    const data = {
      name: goal.name,
      targetAmount: roundMoney(goal.targetAmount),
      currentAmount: roundMoney(currentAmount),
      deadline: goal.deadline ? new Date(goal.deadline) : null,
      color: goal.color,
      icon: goal.icon
    }
    return this.repo.create(username, data)
  }

  public async editGoal ({ id, user, value }: { id: string, user: string, value: Record<string, any> }): Promise<any> {
    const data: Record<string, any> = {}
    if (value.name !== undefined) data.name = value.name
    if (value.targetAmount !== undefined) data.targetAmount = roundMoney(value.targetAmount)
    if (value.deadline !== undefined) data.deadline = value.deadline ? new Date(value.deadline) : null
    if (value.color !== undefined) data.color = value.color
    if (value.icon !== undefined) data.icon = value.icon

    const updated = this.repo.update(id, user, data)
    /* istanbul ignore next — validator validateGoalExist runs before this method via route */
    if (!updated) throw Boom.notFound(ERROR_MESSAGE.GOAL.NOT_FOUND).output
    return updated
  }

  public async getGoals (user: string): Promise<any[]> {
    return this.repo.findAllByUser(user)
  }

  public async getGoal ({ id, user }: { id: string, user: string }): Promise<any> {
    return this.repo.findById(id, user)
  }

  public async deleteGoal ({ id, user }: { id: string, user: string }): Promise<void> {
    const deleted = this.repo.delete(id, user)
    /* istanbul ignore next — validator validateGoalExist runs before this method via route */
    if (!deleted) throw Boom.notFound(ERROR_MESSAGE.GOAL.NOT_FOUND).output
  }

  public async fundGoal ({ id, user, amount }: { id: string, user: string, amount: number }): Promise<any> {
    const goal = this.repo.findById(id, user)
    /* istanbul ignore next — validator validateGoalExist runs before this method via route */
    if (!goal) throw Boom.notFound(ERROR_MESSAGE.GOAL.NOT_FOUND).output

    const newAmount = roundMoney(goal.currentAmount + amount)
    await validateTotalAllocation(this.repo, user, newAmount, id)

    const updated = this.repo.update(id, user, { currentAmount: newAmount })
    /* istanbul ignore next — validator validateGoalExist runs before this method via route */
    if (!updated) throw Boom.notFound(ERROR_MESSAGE.GOAL.NOT_FOUND).output
    return updated
  }

  public async withdrawGoal ({ id, user, amount }: { id: string, user: string, amount: number }): Promise<any> {
    const goal = this.repo.findById(id, user)
    /* istanbul ignore next — validator validateGoalExist runs before this method via route */
    if (!goal) throw Boom.notFound(ERROR_MESSAGE.GOAL.NOT_FOUND).output

    if (goal.currentAmount < amount) {
      throw Boom.badRequest(ERROR_MESSAGE.GOAL.INSUFFICIENT_FUNDS).output
    }

    const newAmount = roundMoney(goal.currentAmount - amount)
    const updated = this.repo.update(id, user, { currentAmount: newAmount })
    /* istanbul ignore next — validator validateGoalExist runs before this method via route */
    if (!updated) throw Boom.notFound(ERROR_MESSAGE.GOAL.NOT_FOUND).output
    return updated
  }
}

export const goalService = new GoalService()
