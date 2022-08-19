import { BudgetModel, CategoryModel, TransactionModel, TransactionType } from '@soker90/finper-models'

export interface IBudgetService {
    getBudgets({
      user,
      year,
      month
    }: { user: string; year: number; month: number }): Promise<any>
}

export default class BudgetService implements IBudgetService {
  public async getBudgets ({
    user,
    year,
    month
  }: { user: string; year: number; month: number }): Promise<any> {
    const transactionsSum = await TransactionModel.aggregate([
      {
        $match: {
          user
          // date: {
          //   $gte: new Date(year, month || 0).getTime(),
          //   $lt: new Date(Number(month ? year : year + 1), Number(month ? month + 1 : 0)).getTime()
          // }
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
      },
      { $sort: { '_id.month': 1 } }
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

    const categories = await CategoryModel.find({ user }, '_id name type').sort('name')

    const expenses = categories.filter(category => category.type === TransactionType.Expense).map(category => {
      return ({
        name: category.name,
        id: category._id
        // values:
      })
    })

    const incomes = categories.filter(category => category.type === TransactionType.Income).map(category => {
      const values = month ? [] : Array(12).fill(0)
      return ({
        name: category.name,
        id: category._id
      })
    })

    return {
      expenses,
      incomes,
      categories,
      budgets,
      transactionsSum
    }
  }
}

/**
 * db.getCollection('categories').aggregate([
 *   {
 *     $match: {
 *       parent: {$exists: true}
 *     }
 *   },
 *   {
 *     $lookup: {
 *       from: "budgets",
 *       localField: "_id",
 *       foreignField: "category",
 *       as: "budgetsList",
 *     }
 *   },
 *   {
 *     $project: {
 *       name: 1,
 *       type: 1,
 *       _id: 1,
 *       budgets: {
 *         $map: {
 *           input: '$budgetsList',
 *           as: 'budgets',
 *           in: {
 *             month: '$$budgets.month',
 *             amount: '$$budgets.amount',
 *             budgetId: '$$budgets._id'
 *           }
 *         }
 *       }
 *     }
 *   },
 *   {$sort: {"budgets.month": 1}},
 * ])
 */
