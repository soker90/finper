import Boom from '@hapi/boom'
import { roundMoney } from '@soker90/finper-db'
import { ERROR_MESSAGE } from '../../i18n'
import type { GoalsRepository } from './goals.repository'
import { goalsRepository } from './goals.repository'

export interface IGoalService {
  addGoal(username: string, goal: Record<string, any>): any
  editGoal({ id, user, value }: { id: string, user: string, value: Record<string, any> }): any
  getGoals(user: string): any[]
  getGoal({ id, user }: { id: string, user: string }): any
  deleteGoal({ id, user }: { id: string, user: string }): void
  fundGoal({ id, user, amount }: { id: string, user: string, amount: number }): any
  withdrawGoal({ id, user, amount }: { id: string, user: string, amount: number }): any
}

/**
 * Valida que la asignación total a objetivos no supere el balance de cuentas activas.
 * Todo SQLite (accounts y goals en la misma base).
 */
const validateTotalAllocation = (
  repo: GoalsRepository,
  username: string,
  newAllocation: number,
  excludeGoalId?: string
): void => {
  const accountBalance = repo.getActiveAccountsBalance(username)
  const otherGoalsTotal = repo.getTotalAllocatedByUser(username, excludeGoalId)

  const totalAfter = roundMoney(otherGoalsTotal + newAllocation)
  if (totalAfter > roundMoney(accountBalance)) {
    throw Boom.badRequest(ERROR_MESSAGE.GOAL.EXCEEDS_BALANCE).output
  }
}

export class GoalService implements IGoalService {
  constructor (private repo: GoalsRepository = goalsRepository) {}

  public addGoal (username: string, goal: Record<string, any>): any {
    const currentAmount = goal.currentAmount ?? 0
    if (currentAmount > 0) {
      validateTotalAllocation(this.repo, username, currentAmount)
    }
    const data = {
      name: goal.name,
      targetAmount: roundMoney(goal.targetAmount),
      currentAmount: roundMoney(currentAmount),
      deadline: goal.deadline ? new Date(goal.deadline).getTime() : null,
      color: goal.color,
      icon: goal.icon
    }
    return this.repo.create(username, data)
  }

  public editGoal ({ id, user, value }: { id: string, user: string, value: Record<string, any> }): any {
    const data: Record<string, any> = {}
    if (value.name !== undefined) data.name = value.name
    if (value.targetAmount !== undefined) data.targetAmount = roundMoney(value.targetAmount)
    if (value.deadline !== undefined) data.deadline = value.deadline ? new Date(value.deadline).getTime() : null
    if (value.color !== undefined) data.color = value.color
    if (value.icon !== undefined) data.icon = value.icon

    const updated = this.repo.update(id, user, data)
    /* istanbul ignore next — validator validateGoalExist runs before this method via route */
    if (!updated) throw Boom.notFound(ERROR_MESSAGE.GOAL.NOT_FOUND).output
    return updated
  }

  public getGoals (user: string): any[] {
    return this.repo.findAllByUser(user)
  }

  public getGoal ({ id, user }: { id: string, user: string }): any {
    return this.repo.findById(id, user)
  }

  public deleteGoal ({ id, user }: { id: string, user: string }): void {
    const deleted = this.repo.delete(id, user)
    /* istanbul ignore next — validator validateGoalExist runs before this method via route */
    if (!deleted) throw Boom.notFound(ERROR_MESSAGE.GOAL.NOT_FOUND).output
  }

  public fundGoal ({ id, user, amount }: { id: string, user: string, amount: number }): any {
    const goal = this.repo.findById(id, user)
    /* istanbul ignore next — validator validateGoalExist runs before this method via route */
    if (!goal) throw Boom.notFound(ERROR_MESSAGE.GOAL.NOT_FOUND).output

    const newAmount = roundMoney(goal.currentAmount + amount)
    validateTotalAllocation(this.repo, user, newAmount, id)

    const updated = this.repo.update(id, user, { currentAmount: newAmount })
    /* istanbul ignore next — validator validateGoalExist runs before this method via route */
    if (!updated) throw Boom.notFound(ERROR_MESSAGE.GOAL.NOT_FOUND).output
    return updated
  }

  public withdrawGoal ({ id, user, amount }: { id: string, user: string, amount: number }): any {
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
