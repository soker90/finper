import { BudgetModel, CategoryModel, TransactionModel } from '@soker90/finper-models'

export interface IBudgetService {
    getBudgets({ user, year, month }: { user: string, year: number, month: number }): Promise<any[]>
}

export default class BudgetService implements IBudgetService {
  public async getBudgets ({ user, year, month }: { user: string, year: number, month?: number }): Promise<any[]> {
    const transactionsSum = await TransactionModel.aggregate([
      {
        $match: {
          user,
          date: {
            $gte: new Date(year, month || 0).getTime(),
            $lt: new Date(Number(month ? year : year + 1), Number(month ? month + 1 : 0)).getTime()
          }
        }
      },
      {
        $group: {
          _id: {
            month: {
              $month: { date: { $toDate: '$date' }, timezone: 'Europe/Madrid' }
            },
            category: '$category'
          },
          total: { $sum: '$amount' }
        }
      }
    ])

    const budgets = await BudgetModel.aggregate([
      {
        $match: {
          user,
          year,
          ...(month && { month })
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'budget.category',
          foreignField: '_id',
          as: 'categoriesList'
        }
      },
      {
        $project: {
          user: 1,
          month: 1,
          budget: {
            $map: {
              input: '$budget',
              as: 'budget',
              in: {
                $mergeObjects: [
                  '$$budget',
                  {
                    $first: {
                      $filter: {
                        input: '$categoriesList',
                        cond: {
                          $eq: [
                            '$$this._id',
                            '$$budget.category'
                          ]
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      },
      { $sort: { month: 1 } }
    ])
    //
    // const incomes = []
    // const expenses = []
    // return budgets.map(item => {
    //     const income
    //   return item.budget.map(budget => ({
    //     name: budget.name,
    //     id: budget._id
    //
    //   }))
    // })
  }
}
