import { CategoryModel, TransactionModel, TransactionType, mongoose } from '@soker90/finper-models'
import { calcBudgetByMonths } from './utils'

interface CategoriesWithBudgets {
    _id: mongoose.ObjectId,
    name: string,
    type: string,
    budgets: {
        month: number,
        amount: number,
        budgetId: mongoose.ObjectId
    }[]
}

export interface IBudgetService {
    getBudgets({
      user,
      year,
      month
    }: { user: string; year: number; month: number }): Promise<any>
}

export default class BudgetService implements IBudgetService {
  private async getCategoriesWithBudgets ({
    user,
    year,
    month
  }: { user: string; year: number; month: number }): Promise<CategoriesWithBudgets[]> {
    return CategoryModel.aggregate([
      {
        $match: {
          parent: { $exists: true },
          user
        }
      },
      {
        $lookup: {
          from: 'budgets',
          let: { categoryId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$category', '$$categoryId'] },
                    { $eq: ['$year', year] },
                    { $eq: ['$user', user] },
                    ...(month ? [{ $eq: ['$month', month] }] : [])
                  ]
                }
              }
            }
          ],
          as: 'budgetsList'
        }
      },
      {
        $project: {
          name: 1,
          type: 1,
          _id: 1,
          budgets: {
            $map: {
              input: '$budgetsList',
              as: 'budgets',
              in: {
                month: '$$budgets.month',
                amount: '$$budgets.amount',
                budgetId: '$$budgets._id'
              }
            }
          }
        }
      },
      { $sort: { 'budgets.month': 1 } }
    ])
  }

  private getBudgetsByType ({
    filterType,
    categoriesWithBudgets,
    transactionsSum,
    month

  }: { filterType: TransactionType; categoriesWithBudgets: CategoriesWithBudgets[]; transactionsSum: any; month?: number }): any {
    return categoriesWithBudgets.filter(({ type }) => type === filterType).map(category => calcBudgetByMonths({
      category,
      transactionsSum,
      month
    }))
  }

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

    const categoriesWithBudgets = await this.getCategoriesWithBudgets({ user, year, month })

    const expenses = this.getBudgetsByType({
      filterType: TransactionType.Expense,
      categoriesWithBudgets,
      transactionsSum,
      month
    })

    const incomes = this.getBudgetsByType({
      filterType: TransactionType.Income,
      categoriesWithBudgets,
      transactionsSum,
      month
    })

    return {
      expenses,
      incomes
    }
  }
}
