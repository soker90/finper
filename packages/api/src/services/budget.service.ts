import { TRANSACTION, TransactionType } from '@soker90/finper-types'
import { CategoryModel, mongoose, IBudget, BudgetModel } from '@soker90/finper-models'
import { calcBudgetByMonths, getTransactionsSumByMonth } from './utils'

interface CategoriesWithBudgets {
  _id: mongoose.ObjectId,
  name: string,
  type: string,
  budgetRuleClass: string,
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
          from: 'categories',
          localField: 'parent',
          foreignField: '_id',
          as: 'parentDoc'
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
          budgetRuleClass: {
            $let: {
              vars: {
                parentRule: { $arrayElemAt: ['$parentDoc.budgetRuleClass', 0] }
              },
              in: {
                $cond: {
                  if: {
                    $and: [
                      { $ne: ['$budgetRuleClass', 'none'] },
                      { $ne: ['$budgetRuleClass', null] }
                    ]
                  },
                  then: '$budgetRuleClass',
                  else: { $ifNull: ['$$parentRule', 'none'] }
                }
              }
            }
          },
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

  private calculateRule503020 ({ expenses, incomes }: { expenses: any[], incomes: any[] }) {
    const activeExpenses = expenses.filter(category => category.id !== 'totals')
    const activeIncomes = incomes.filter(category => category.id !== 'totals')

    const sumCategoryBudgets = (categories: any[], key: 'amount' | 'real'): number => {
      let total = 0
      categories.forEach(category => {
        category.budgets.forEach((budget: any) => {
          total += (budget[key] ?? 0)
        })
      })
      return Math.round(total * 100) / 100
    }

    const incomeBudgeted = sumCategoryBudgets(activeIncomes, 'amount')
    const incomeReal = sumCategoryBudgets(activeIncomes, 'real')

    const needsBudgeted = sumCategoryBudgets(activeExpenses.filter(c => c.budgetRuleClass === 'needs'), 'amount')
    const needsReal = sumCategoryBudgets(activeExpenses.filter(c => c.budgetRuleClass === 'needs'), 'real')

    const wantsBudgeted = sumCategoryBudgets(activeExpenses.filter(c => c.budgetRuleClass === 'wants'), 'amount')
    const wantsReal = sumCategoryBudgets(activeExpenses.filter(c => c.budgetRuleClass === 'wants'), 'real')

    const savingsBudgeted = Math.round((incomeBudgeted - (needsBudgeted + wantsBudgeted)) * 100) / 100
    const savingsReal = Math.round((incomeReal - (needsReal + wantsReal)) * 100) / 100

    const getPercentage = (value: number, total: number): number => {
      if (total <= 0) return 0
      return Math.round((value / total) * 10000) / 100
    }

    return {
      needs: {
        budgeted: needsBudgeted,
        real: needsReal,
        percentageBudgeted: getPercentage(needsBudgeted, incomeBudgeted),
        percentageReal: getPercentage(needsReal, incomeReal)
      },
      wants: {
        budgeted: wantsBudgeted,
        real: wantsReal,
        percentageBudgeted: getPercentage(wantsBudgeted, incomeBudgeted),
        percentageReal: getPercentage(wantsReal, incomeReal)
      },
      savings: {
        budgeted: savingsBudgeted,
        real: savingsReal,
        percentageBudgeted: getPercentage(savingsBudgeted, incomeBudgeted),
        percentageReal: getPercentage(savingsReal, incomeReal)
      },
      totals: {
        incomeBudgeted,
        incomeReal
      }
    }
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

    const rule503020 = this.calculateRule503020({ expenses, incomes })

    return {
      expenses,
      incomes,
      rule503020
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
