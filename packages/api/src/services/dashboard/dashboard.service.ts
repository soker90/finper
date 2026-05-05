import { AccountModel, DebtModel, LoanModel, PensionModel, TransactionModel, TRANSACTION, type IPension } from '@soker90/finper-models'
import { generateInsights } from '../utils/insights'
import { computeHealthScore, computeBudgetAdherence } from './health-score'
import { computeFilteredAvgMonthlyExpense, type MonthTransactionsRow } from './cash-runway'
import {
  aggregateCurrentMonthByCategory,
  aggregateLast3MonthsByCategory,
  aggregateLast3MonthsTransactions,
  aggregateCurrentBudgets
} from './aggregations'
import type { DashboardStatsResult, IDashboardService, PensionSummary, DailyExpense } from './dashboard.types'

/** Builds the cumulative daily expense array from a day→amount map. */
const buildCumulativeDailyExpenses = (
  dailyMap: Map<number, number>,
  daysInMonth: number
): DailyExpense[] => {
  const result: DailyExpense[] = []
  let cumulative = 0
  for (let d = 1; d <= daysInMonth; d++) {
    cumulative += dailyMap.get(d) ?? 0
    result.push({ day: d, amount: Math.round(cumulative * 100) / 100 })
  }
  return result
}

export default class DashboardService implements IDashboardService {
  public async getStats ({ user }: { user: string }): Promise<DashboardStatsResult> {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()        // 0-indexed
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear

    // Epoch timestamps for $match stages
    const currentMonthStart = new Date(currentYear, currentMonth, 1).getTime()
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 1).getTime()
    const previousMonthStart = new Date(previousYear, previousMonth, 1).getTime()
    const previousMonthEnd = new Date(currentYear, currentMonth, 1).getTime()
    // last3MonthsStart is shared by two aggregations with different upper bounds:
    //   - category insights  → uses currentMonthEnd  (includes current month data)
    //   - cash runway        → uses currentMonthStart (only completed months)
    const last3MonthsStart = new Date(currentYear, currentMonth - 3, 1).getTime()
    const last6MonthsStart = new Date(currentYear, currentMonth - 5, 1).getTime()

    const TIMEZONE = 'Europe/Madrid'

    const [
      accountsResult,
      debtsResult,
      loansResult,
      currentMonthAgg,
      previousMonthAgg,
      last6MonthsAgg,
      currentVelocityAgg,
      previousVelocityAgg,
      topCategoriesAgg,
      topStoresAgg,
      pensionStatsAgg,
      pensionTransactions,
      currentMonthBudgetAgg,
      currentMonthByCategoryAgg,
      last3MonthsByCategoryAgg,
      last3MonthsTransactionsAgg,
      currentBudgetsAgg
    ] = await Promise.all([
      // 1. Sum of active account balances
      AccountModel.aggregate([
        { $match: { user, isActive: true } },
        { $group: { _id: null, total: { $sum: '$balance' } } }
      ]),

      // 2. Sum of outstanding debts
      DebtModel.aggregate([
        { $match: { user } },
        {
          $group: {
            _id: null,
            totalOwed: {
              $sum: {
                $cond: {
                  if: { $eq: ['$type', 'to'] },
                  then: '$amount',
                  else: 0
                }
              }
            },
            totalReceivable: {
              $sum: {
                $cond: {
                  if: { $eq: ['$type', 'from'] },
                  then: '$amount',
                  else: 0
                }
              }
            }
          }
        }
      ]),

      // 3. Sum of pending capital on active loans
      LoanModel.aggregate([
        { $match: { user, pendingAmount: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$pendingAmount' } } }
      ]),

      // 4. Income and expenses for the current month
      TransactionModel.aggregate([
        {
          $match: {
            user,
            date: { $gte: currentMonthStart, $lt: currentMonthEnd },
            type: { $in: [TRANSACTION.Income, TRANSACTION.Expense] }
          }
        },
        {
          $group: {
            _id: null,
            income: {
              $sum: { $cond: [{ $eq: ['$type', TRANSACTION.Income] }, '$amount', 0] }
            },
            expenses: {
              $sum: { $cond: [{ $eq: ['$type', TRANSACTION.Expense] }, '$amount', 0] }
            }
          }
        }
      ]),

      // 5. Income and expenses for the previous month
      TransactionModel.aggregate([
        {
          $match: {
            user,
            date: { $gte: previousMonthStart, $lt: previousMonthEnd },
            type: { $in: [TRANSACTION.Income, TRANSACTION.Expense] }
          }
        },
        {
          $group: {
            _id: null,
            income: {
              $sum: { $cond: [{ $eq: ['$type', TRANSACTION.Income] }, '$amount', 0] }
            },
            expenses: {
              $sum: { $cond: [{ $eq: ['$type', TRANSACTION.Expense] }, '$amount', 0] }
            }
          }
        }
      ]),

      // 6. Monthly summary for the last 6 months
      TransactionModel.aggregate([
        {
          $match: {
            user,
            date: { $gte: last6MonthsStart },
            type: { $in: [TRANSACTION.Income, TRANSACTION.Expense] }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: { date: { $toDate: '$date' }, timezone: TIMEZONE } },
              month: { $month: { date: { $toDate: '$date' }, timezone: TIMEZONE } }
            },
            income: {
              $sum: { $cond: [{ $eq: ['$type', TRANSACTION.Income] }, '$amount', 0] }
            },
            expenses: {
              $sum: { $cond: [{ $eq: ['$type', TRANSACTION.Expense] }, '$amount', 0] }
            }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        {
          $project: {
            _id: 0,
            year: '$_id.year',
            month: '$_id.month',
            income: 1,
            expenses: 1
          }
        }
      ]),

      // 7. Daily expense totals for the current month (for velocity chart)
      TransactionModel.aggregate([
        {
          $match: {
            user,
            date: { $gte: currentMonthStart, $lt: currentMonthEnd },
            type: TRANSACTION.Expense
          }
        },
        {
          $group: {
            _id: { $dayOfMonth: { date: { $toDate: '$date' }, timezone: TIMEZONE } },
            amount: { $sum: '$amount' }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // 8. Daily expense totals for the previous month (for velocity chart)
      TransactionModel.aggregate([
        {
          $match: {
            user,
            date: { $gte: previousMonthStart, $lt: previousMonthEnd },
            type: TRANSACTION.Expense
          }
        },
        {
          $group: {
            _id: { $dayOfMonth: { date: { $toDate: '$date' }, timezone: TIMEZONE } },
            amount: { $sum: '$amount' }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // 9. Top expense categories for the current month — includes parentName for hierarchical Treemap
      TransactionModel.aggregate([
        {
          $match: {
            user,
            date: { $gte: currentMonthStart, $lt: currentMonthEnd },
            type: TRANSACTION.Expense
          }
        },
        {
          $group: {
            _id: '$category',
            amount: { $sum: '$amount' }
          }
        },
        { $sort: { amount: -1 } },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'categoryDoc'
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryDoc.parent',
            foreignField: '_id',
            as: 'parentDoc'
          }
        },
        {
          $project: {
            _id: 0,
            name: { $ifNull: [{ $arrayElemAt: ['$categoryDoc.name', 0] }, 'Sin categoría'] },
            parentName: { $ifNull: [{ $arrayElemAt: ['$parentDoc.name', 0] }, null] },
            amount: 1
          }
        }
      ]),

      // 10. Top stores for the current month
      TransactionModel.aggregate([
        {
          $match: {
            user,
            date: { $gte: currentMonthStart, $lt: currentMonthEnd },
            type: TRANSACTION.Expense,
            store: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$store',
            amount: { $sum: '$amount' }
          }
        },
        { $sort: { amount: -1 } },
        {
          $lookup: {
            from: 'stores',
            localField: '_id',
            foreignField: '_id',
            as: 'storeDoc'
          }
        },
        {
          $project: {
            _id: 0,
            name: { $ifNull: [{ $arrayElemAt: ['$storeDoc.name', 0] }, 'Sin tienda'] },
            amount: 1
          }
        }
      ]),

      // 11. Pension: accumulated totals
      PensionModel.aggregate([
        { $match: { user } },
        {
          $group: {
            _id: '$user',
            employeeAmount: { $sum: '$employeeAmount' },
            companyAmount: { $sum: '$companyAmount' },
            totalUnits: { $sum: { $sum: ['$employeeUnits', '$companyUnits'] } },
            lastValue: { $last: '$value' }
          }
        }
      ]).sort({ date: -1 }),

      // 12. Pension: individual records (for sparkline)
      PensionModel.find({ user }).sort({ date: -1 }),

      // 13. Total real expenses for the current month (for budget adherence)
      TransactionModel.aggregate([
        {
          $match: {
            user,
            date: { $gte: currentMonthStart, $lt: currentMonthEnd },
            type: TRANSACTION.Expense
          }
        },
        {
          $group: {
            _id: null,
            realExpenses: { $sum: '$amount' }
          }
        }
      ]),

      // 14. Current month expenses grouped by child category (for insights: anomaly detection)
      aggregateCurrentMonthByCategory(user, currentMonthStart, currentMonthEnd),

      // 15. Last 3-month average expense per child category (for insights: anomaly detection)
      aggregateLast3MonthsByCategory(user, last3MonthsStart, currentMonthEnd),

      // 16. Individual expense transactions grouped by month (for cash runway outlier filtering)
      aggregateLast3MonthsTransactions(user, last3MonthsStart, currentMonthStart),

      // 17. Configured budgets for the current month (for insights: velocity check)
      aggregateCurrentBudgets(user, currentYear, currentMonth + 1)
    ])

    // Scalar extraction
    const totalBalance = Math.round((accountsResult[0]?.total ?? 0) * 100) / 100
    const totalDebts = Math.round((debtsResult[0]?.totalOwed ?? 0) * 100) / 100
    const totalReceivable = Math.round((debtsResult[0]?.totalReceivable ?? 0) * 100) / 100
    const totalLoansPending = Math.round((loansResult[0]?.total ?? 0) * 100) / 100
    const netWorth = Math.round((totalBalance - totalDebts - totalLoansPending + totalReceivable) * 100) / 100

    const monthlyIncome = Math.round((currentMonthAgg[0]?.income ?? 0) * 100) / 100
    const monthlyExpenses = Math.round((currentMonthAgg[0]?.expenses ?? 0) * 100) / 100
    const prevIncome = Math.round((previousMonthAgg[0]?.income ?? 0) * 100) / 100
    const prevExpenses = Math.round((previousMonthAgg[0]?.expenses ?? 0) * 100) / 100

    const savingsRate = monthlyIncome > 0
      ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 10000) / 100
      : 0

    // Expense velocity
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const daysInPreviousMonth = new Date(previousYear, previousMonth + 1, 0).getDate()

    const currentVelocityMap = new Map<number, number>(
      currentVelocityAgg.map((e: { _id: number; amount: number }) => [e._id, e.amount])
    )
    const previousVelocityMap = new Map<number, number>(
      previousVelocityAgg.map((e: { _id: number; amount: number }) => [e._id, e.amount])
    )

    const expenseVelocity = {
      currentMonth: buildCumulativeDailyExpenses(currentVelocityMap, daysInCurrentMonth),
      previousMonth: buildCumulativeDailyExpenses(previousVelocityMap, daysInPreviousMonth)
    }

    // Daily average and projection
    const dayOfMonth = now.getDate()
    const dailyAvgExpense = dayOfMonth > 0
      ? Math.round((monthlyExpenses / dayOfMonth) * 100) / 100
      : 0
    const projectedMonthlyExpense = Math.round(dailyAvgExpense * daysInCurrentMonth * 100) / 100

    // Cash runway with outlier filtering
    const filteredAvgMonthlyExpense = computeFilteredAvgMonthlyExpense(
      last3MonthsTransactionsAgg as MonthTransactionsRow[],
      monthlyExpenses
    )

    const cashRunwayMonths = filteredAvgMonthlyExpense > 0
      ? Math.round((totalBalance / filteredAvgMonthlyExpense) * 10) / 10
      : 0

    // Top categories: only those with a positive net amount
    const topExpenseCategories = (topCategoriesAgg as Array<{ name: string; amount: number; parentName?: string }>)
      .filter(c => c.amount > 0)

    // Top stores: only those with a positive net amount
    const topStores = (topStoresAgg as Array<{ name: string; amount: number }>)
      .filter(s => s.amount > 0)

    // Pension
    let pension: PensionSummary | null = null
    let pensionReturnPct = 0

    if (pensionStatsAgg.length > 0) {
      const ps = pensionStatsAgg[0] as {
        employeeAmount: number
        companyAmount: number
        totalUnits: number
        lastValue: number
      }
      const pensionTotal = Math.round((ps.lastValue ?? 0) * (ps.totalUnits ?? 0) * 100) / 100
      const pensionContributed = (ps.employeeAmount ?? 0) + (ps.companyAmount ?? 0)

      pensionReturnPct = pensionContributed > 0
        ? Math.round(((pensionTotal - pensionContributed) / pensionContributed) * 10000) / 100
        : 0

      pension = {
        employeeAmount: Math.round((ps.employeeAmount ?? 0) * 100) / 100,
        companyAmount: Math.round((ps.companyAmount ?? 0) * 100) / 100,
        total: pensionTotal,
        transactions: pensionTransactions as IPension[]
      }
    }

    // Budget adherence
    // Uses actual configured budgets when available, falls back to previous month expenses.
    const realExpenses = currentMonthBudgetAgg[0]?.realExpenses ?? 0
    const totalBudgetAmount = (currentBudgetsAgg as Array<{ amount: number }>)
      .reduce((sum, b) => sum + b.amount, 0)

    const budgetAdherencePct = computeBudgetAdherence(realExpenses, totalBudgetAmount, prevExpenses)

    // Health Score
    const healthScore = computeHealthScore(
      savingsRate,
      totalDebts + totalLoansPending,
      totalBalance,
      budgetAdherencePct,
      cashRunwayMonths,
      pensionReturnPct
    )

    // Dynamic insights
    const insights = generateInsights({
      currentMonthByCategory: currentMonthByCategoryAgg,
      last3MonthsByCategory: last3MonthsByCategoryAgg,
      budgets: currentBudgetsAgg,
      dayOfMonth,
      daysInMonth: daysInCurrentMonth,
      last6Months: last6MonthsAgg
    })

    return {
      totalBalance,
      totalDebts,
      totalLoansPending,
      netWorth,
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      monthlyTrend: {
        income: { current: monthlyIncome, previous: prevIncome },
        expenses: { current: monthlyExpenses, previous: prevExpenses }
      },
      last6Months: last6MonthsAgg,
      expenseVelocity,
      dailyAvgExpense,
      projectedMonthlyExpense,
      cashRunwayMonths,
      topExpenseCategories,
      topStores,
      pension,
      pensionReturnPct,
      budgetAdherencePct,
      healthScore,
      insights
    }
  }
}
