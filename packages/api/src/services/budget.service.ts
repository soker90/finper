import { BudgetModel, CategoryModel } from '@soker90/finper-models'

export interface IBudgetService {
    getBudgets({ user, year, month }: { user: string, year: number, month: number }): Promise<any[]>
}

export default class BudgetService implements IBudgetService {
  public async getBudgets ({ user, year, month }: { user: string, year: number, month?: number }): Promise<any[]> {
    // return (await BudgetModel.find({
    //   user,
    //   year,
    //   ...(month && [month])
    // }, 'month budget').populate('budget.category', 'name type')) as IBudget[]

    // const c =  CategoryModel.find({
    //     user,
    //     parent: {$exists: false}
    // }, 'name type').populate('parent', 'name type root').then(categories => {
    // }

    await BudgetModel.find({})
    return CategoryModel.aggregate([
      {
        $match: {
          user,
          parent: { $exists: false }
        }
      },
      {
        $lookup: {
          from: 'budgets',
          localField: '_id',
          foreignField: 'budget.category',
          as: 'budget'
        }
      },
      { $sort: { name: 1, children: 1 } }
    ])
  }
}
