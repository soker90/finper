import { BudgetModel, IBudget } from '@soker90/finper-models'

export interface IBudgetService {
    getBudgets({ user, year, month }: { user: string, year: number, month: number }): Promise<IBudget[]>
}

export default class BudgetService implements IBudgetService {
  public async getBudgets ({ user, year, month }: { user: string, year: number, month: number }): Promise<IBudget[]> {
    return BudgetModel.find({ user, year, month }, '_id budget')
  }
}
