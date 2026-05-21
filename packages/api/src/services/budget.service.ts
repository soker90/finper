import { CategoryModel, TransactionType, TRANSACTION, mongoose, IBudget, BudgetModel } from '@soker90/finper-models'
import { calcBudgetByMonths, getTransactionsSumByMonth } from './utils'

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

  editBudget({ category, year, month, user, amount }: IBudget): Promise<IBudget>

  copy({
    monthOrigin,
    yearOrigin,
    month,
    year,
    user
  }: { monthOrigin: number, yearOrigin: number, month: number, year: number, user: string }): Promise<boolean>
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
                    ...(!isNaN(month) ? [{ $eq: ['$month', month] }] : [])
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
                year: '$$budgets.year'
              }
            }
          }
        }
      },
      { $sort: { 'budgets.month': 1 } }
    ])
  }

  private getTotalsByMonth = (categories: any[]): { name: string, id: string, budgets: { amount: number, real: number, month?: number, year?: number }[] } => {
    const totals: {
      name: string, id: string, budgets: { amount: number, real: number }[], total: number
    } = {
      name: 'Totales',
      id: 'totals',
      budgets: [],
      total: 0
    }

    let totalYear = 0

    categories.forEach(({ budgets }) => {
      if (totals.budgets.length > 0) {
        budgets.forEach((budget: { amount: number, real: number }, index: number) => {
          totals.budgets[index].amount += budget.amount
          totals.budgets[index].real += budget.real
          totalYear += budget.real
        })
      } else {
        budgets.forEach((budget: { amount: number, real: number }) => {
          totals.budgets.push({ amount: budget.amount, real: budget.real })
          totalYear += budget.real
        })
      }
    })

    totals.total = totalYear

    return totals
  }

  private getBudgetsByType ({
    filterType,
    categoriesWithBudgets,
    transactionsSum,
    month

  }: { filterType: TransactionType; categoriesWithBudgets: CategoriesWithBudgets[]; transactionsSum: any; month?: number }): any {
    const categoriesByType = categoriesWithBudgets.filter(({ type }) => type === filterType).map(category => calcBudgetByMonths({
      category,
      transactionsSum,
      month
    }))

    const getRealValue = (item: any) => isNaN(month as number) ? (item.total ?? 0) : (item.budgets?.[0]?.real ?? 0)
    categoriesByType.sort((a, b) => getRealValue(b) - getRealValue(a))

    if (categoriesByType.length > 0) {
      categoriesByType.push(this.getTotalsByMonth(categoriesByType))
    }

    return categoriesByType
  }

  public async getBudgets ({
    user,
    year,
    month
  }: { user: string; year: number; month: number }): Promise<any> {
    const transactionsSum = await getTransactionsSumByMonth({ user, year, month })
    const categoriesWithBudgets = await this.getCategoriesWithBudgets({ user, year, month })

    const expenses = this.getBudgetsByType({
      filterType: TRANSACTION.Expense,
      categoriesWithBudgets,
      transactionsSum,
      month
    })

    const incomes = this.getBudgetsByType({
      filterType: TRANSACTION.Income,
      categoriesWithBudgets,
      transactionsSum,
      month
    })

    return {
      expenses,
      incomes
    }
  }

  public async editBudget ({ category, year, month, user, amount }: IBudget): Promise<IBudget> {
    return await BudgetModel.findOneAndUpdate({ category, year, month, user }, { amount }, {
      returnDocument: 'after',
      upsert: true
    }) as unknown as IBudget
  }

  public async copy ({
    monthOrigin,
    yearOrigin,
    month,
    year,
    user
  }: { monthOrigin: number, yearOrigin: number, month: number, year: number, user: string }): Promise<boolean> {
    const budgets = await BudgetModel.find({ user, month: monthOrigin, year: yearOrigin }, 'category amount').lean()

    if (!budgets.length) {
      return false
    }

    const operations = budgets.map(budget => ({
      updateOne: {
        filter: { category: budget.category, year, month, user },
        update: { $set: { amount: budget.amount } },
        upsert: true
      }
    }))

    await BudgetModel.bulkWrite(operations as mongoose.AnyBulkWriteOperation<IBudget>[])
    return true
  }
}
