import { IGoal, GoalModel, GoalDocument, AccountModel, Types } from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../i18n'
import { roundNumber } from '../utils/roundNumber'

export interface IGoalService {
  addGoal(goal: IGoal): Promise<GoalDocument>
  editGoal({ id, value }: { id: string, value: Partial<IGoal> }): Promise<GoalDocument>
  getGoals(user: string): Promise<GoalDocument[]>
  getGoal(id: string): Promise<GoalDocument | null>
  deleteGoal(id: string): Promise<void>
  fundGoal({ id, amount }: { id: string, amount: number }): Promise<GoalDocument>
  withdrawGoal({ id, amount }: { id: string, amount: number }): Promise<GoalDocument>
}

export default class GoalService implements IGoalService {
  public async addGoal (goal: IGoal): Promise<GoalDocument> {
    const created = await GoalModel.create(goal)
    if (goal.currentAmount > 0) {
      try {
        await this.validateTotalAllocation(goal.user, created._id.toString(), goal.currentAmount)
      } catch (error) {
        await GoalModel.findByIdAndDelete(created._id)
        throw error
      }
    }
    return created
  }

  public async editGoal ({ id, value }: { id: string, value: Partial<IGoal> }): Promise<GoalDocument> {
    if (value.currentAmount !== undefined) {
      const goal = await GoalModel.findById<GoalDocument>(id)
      /* istanbul ignore next — validator validateGoalExist runs before this method via route */
      if (!goal) throw Boom.notFound(ERROR_MESSAGE.GOAL.NOT_FOUND).output
      await this.validateTotalAllocation(goal.user, id, value.currentAmount)
    }
    const updated = await GoalModel.findByIdAndUpdate<GoalDocument>(id, value, { returnDocument: 'after' })
    /* istanbul ignore next — validator validateGoalExist runs before this method via route */
    if (!updated) throw Boom.notFound(ERROR_MESSAGE.GOAL.NOT_FOUND).output
    return updated
  }

  public async getGoals (user: string): Promise<GoalDocument[]> {
    return GoalModel.find({ user })
  }

  public async getGoal (id: string): Promise<GoalDocument | null> {
    return GoalModel.findOne({ _id: id })
  }

  public async deleteGoal (id: string): Promise<void> {
    const deleted = await GoalModel.findByIdAndDelete(id)
    /* istanbul ignore next — validator validateGoalExist runs before this method via route */
    if (!deleted) throw Boom.notFound(ERROR_MESSAGE.GOAL.NOT_FOUND).output
  }

  public async fundGoal ({ id, amount }: { id: string, amount: number }): Promise<GoalDocument> {
    const goal = await GoalModel.findById<GoalDocument>(id)
    /* istanbul ignore next — validator validateGoalExist runs before this method via route */
    if (!goal) throw Boom.notFound(ERROR_MESSAGE.GOAL.NOT_FOUND).output

    const newAmount = roundNumber(goal.currentAmount + amount)
    await this.validateTotalAllocation(goal.user, id, newAmount)

    const updated = await GoalModel.findOneAndUpdate<GoalDocument>(
      { _id: id },
      { $inc: { currentAmount: amount } },
      { returnDocument: 'after' }
    )
    /* istanbul ignore next — validator validateGoalExist runs before this method via route */
    if (!updated) throw Boom.notFound(ERROR_MESSAGE.GOAL.NOT_FOUND).output
    return updated
  }

  public async withdrawGoal ({ id, amount }: { id: string, amount: number }): Promise<GoalDocument> {
    const updated = await GoalModel.findOneAndUpdate<GoalDocument>(
      { _id: id, currentAmount: { $gte: amount } },
      { $inc: { currentAmount: -amount } },
      { returnDocument: 'after' }
    )
    if (!updated) {
      throw Boom.badRequest(ERROR_MESSAGE.GOAL.INSUFFICIENT_FUNDS).output
    }
    return updated
  }

  private async validateTotalAllocation (user: string, excludeGoalId: string, newAmount: number): Promise<void> {
    const [accountResult, goalsResult] = await Promise.all([
      AccountModel.aggregate([
        { $match: { user, isActive: true } },
        { $group: { _id: null, total: { $sum: '$balance' } } }
      ]),
      GoalModel.aggregate([
        { $match: { user, _id: { $ne: new Types.ObjectId(excludeGoalId) } } },
        { $group: { _id: null, total: { $sum: '$currentAmount' } } }
      ])
    ])

    const totalBalance = roundNumber(accountResult[0]?.total ?? 0)
    const otherGoalsSum = roundNumber(goalsResult[0]?.total ?? 0)
    const totalAllocated = roundNumber(otherGoalsSum + newAmount)

    if (totalAllocated > totalBalance) {
      throw Boom.badRequest(ERROR_MESSAGE.GOAL.EXCEEDS_BALANCE).output
    }
  }
}
