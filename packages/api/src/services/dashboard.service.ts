import { AccountModel, BudgetModel, DebtModel, LoanModel, PensionModel, TransactionModel, TRANSACTION, type IPension } from '@soker90/finper-models'
import { generateInsights, type Insight, type MonthlyData } from './utils/insights'

export type { MonthlyData }

export interface DailyExpense {
  day: number
  amount: number
}

export interface HealthScore {
  total: number
  savingsRate: number
  debtRatio: number
  budgetAdherence: number
  cashRunway: number
  pensionReturn: number
}

export interface PensionSummary {
  employeeAmount: number
  companyAmount: number
  total: number
  transactions: IPension[]
}

export interface DashboardStatsResult {
  // Accounts and debts
  totalBalance: number
  totalDebts: number
  totalLoansPending: number
  netWorth: number

  // Current month
  monthlyIncome: number
  monthlyExpenses: number
  savingsRate: number

  // Trend vs previous month
  monthlyTrend: {
    income: { current: number; previous: number }
    expenses: { current: number; previous: number }
  }

  // Last 6 months (for bar chart)
  last6Months: MonthlyData[]

  // Expense velocity (daily cumulative)
  expenseVelocity: {
    currentMonth: DailyExpense[]
    previousMonth: DailyExpense[]
  }

  // Averages and projections
  dailyAvgExpense: number
  projectedMonthlyExpense: number
  cashRunwayMonths: number

  // Monthly rankings — topExpenseCategories includes parentName for hierarchical Treemap
  topExpenseCategories: Array<{ name: string; amount: number; parentName?: string }>
  topStores: Array<{ name: string; amount: number }>

  // Pension
  pension: PensionSummary | null
  pensionReturnPct: number

  // Monthly budget
  budgetAdherencePct: number

  // Health Score
  healthScore: HealthScore

  // Dynamic insights
  insights: Insight[]
}

export interface IDashboardService {
  getStats(params: { user: string }): Promise<DashboardStatsResult>
}

/**
 * Computes the financial health score from 5 weighted sub-scores.
 *
 * Weights: savingsRate 25%, debtRatio 20%, budgetAdherence 20%,
 *          cashRunway 20%, pensionReturn 15%.
 */
export const computeHealthScore = (
  savingsRate: number,        // e.g. 15 → 15%
  totalDebts: number,         // absolute monetary value
  totalBalance: number,       // absolute monetary value
  budgetAdherencePct: number, // 0–100
  cashRunwayMonths: number,   // number of months
  pensionReturnPct: number    // e.g. 4.5 → 4.5%
): HealthScore => {
  const clamp = (v: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, v))

  const savingsScore = Math.round(clamp(savingsRate / 20, 0, 1) * 100)
  const debtScore = Math.round(Math.max(0, 1 - (totalBalance > 0 ? totalDebts / totalBalance : 1)) * 100)
  const budgetScore = Math.round(Math.min(budgetAdherencePct, 100))
  const runwayScore = Math.round(Math.min(cashRunwayMonths / 6, 1) * 100)
  const pensionScore = Math.round(clamp(pensionReturnPct / 5, 0, 1) * 100)

  const total = Math.round(
    savingsScore * 0.25 +
    debtScore * 0.20 +
    budgetScore * 0.20 +
    runwayScore * 0.20 +
    pensionScore * 0.15
  )

  return {
    total,
    savingsRate: savingsScore,
    debtRatio: debtScore,
    budgetAdherence: budgetScore,
    cashRunway: runwayScore,
    pensionReturn: pensionScore
  }
}

const TIMEZONE = 'Europe/Madrid'

/** Current month expenses grouped by child category, with name */
const aggregateCurrentMonthByCategory = (
  user: string,
  from: number,
  to: number
) => TransactionModel.aggregate([
  { $match: { user, date: { $gte: from, $lt: to }, type: TRANSACTION.Expense } },
  { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
  { $unwind: '$cat' },
  { $project: { _id: 0, categoryId: '$_id', name: '$cat.name', total: 1, count: 1 } }
])

/** Monthly average expense per child category over the given range (excludes current month) */
const aggregateLast3MonthsByCategory = (
  user: string,
  from: number,
  to: number
) => TransactionModel.aggregate([
  { $match: { user, date: { $gte: from, $lt: to }, type: TRANSACTION.Expense } },
  {
    $group: {
      _id: {
        category: '$category',
        year: { $year: { date: { $toDate: '$date' }, timezone: TIMEZONE } },
        month: { $month: { date: { $toDate: '$date' }, timezone: TIMEZONE } }
      },
      total: { $sum: '$amount' }
    }
  },
  { $group: { _id: '$_id.category', avgMonthly: { $avg: '$total' } } },
  { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
  { $unwind: '$cat' },
  { $project: { _id: 0, categoryId: '$_id', name: '$cat.name', avgMonthly: 1 } }
])

/** Individual expense transactions grouped by month, used for outlier filtering */
const aggregateLast3MonthsTransactions = (
  user: string,
  from: number,
  to: number
) => TransactionModel.aggregate([
  { $match: { user, date: { $gte: from, $lt: to }, type: TRANSACTION.Expense } },
  {
    $group: {
      _id: {
        year: { $year: { date: { $toDate: '$date' }, timezone: TIMEZONE } },
        month: { $month: { date: { $toDate: '$date' }, timezone: TIMEZONE } }
      },
      transactions: { $push: '$amount' },
      total: { $sum: '$amount' },
      count: { $sum: 1 }
    }
  }
])

/** Current month budgets with category name */
const aggregateCurrentBudgets = (
  user: string,
  year: number,
  month: number   // 1-indexed
) => BudgetModel.aggregate([
  { $match: { user, year, month } },
  { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'cat' } },
  { $unwind: '$cat' },
  { $project: { _id: 0, categoryId: '$category', name: '$cat.name', amount: 1 } }
])

const OUTLIER_MULTIPLE = 3     // > 3x the mean transaction amount for the month → outlier
const OUTLIER_SHARE = 0.30     // > 30% of the month's total expense → outlier

export const isOutlier = (
  amount: number,
  monthTotal: number,
  meanPerTransaction: number
): boolean =>
  amount > meanPerTransaction * OUTLIER_MULTIPLE ||
  amount > monthTotal * OUTLIER_SHARE

interface MonthTransactionsRow {
  transactions: number[]
  total: number
  count: number
}

/** Returns the sum of non-outlier transactions for a single month. */
export const filterMonthOutliers = (month: MonthTransactionsRow): number => {
  const { transactions, total, count } = month
  if (count === 0 || total === 0) return 0

  const meanPerTransaction = total / count
  return transactions
    .filter(amount => !isOutlier(amount, total, meanPerTransaction))
    .reduce((sum, amount) => sum + amount, 0)
}

/**
 * Computes the average monthly expense after removing outlier transactions.
 * Falls back to the provided value when there is no valid monthly data.
 */
export const computeFilteredAvgMonthlyExpense = (
  monthlyData: MonthTransactionsRow[],
  fallback: number
): number => {
  const filteredTotals = monthlyData
    .filter(m => m.count > 0 && m.total > 0)
    .map(filterMonthOutliers)

  return filteredTotals.length > 0
    ? filteredTotals.reduce((sum, t) => sum + t, 0) / filteredTotals.length
    : fallback
}

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
    const last3MonthsStart = new Date(currentYear, currentMonth - 2, 1).getTime()
    const last6MonthsStart = new Date(currentYear, currentMonth - 5, 1).getTime()

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
      aggregateLast3MonthsTransactions(user, last3MonthsStart, currentMonthEnd),

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
    // Uses real expenses vs previous month as a proxy when no budget amount is configured.
    // If monthlyExpenses <= prevExpenses → good adherence. Returns 100 when there is no prior data.
    const realExpenses = currentMonthBudgetAgg[0]?.realExpenses ?? 0
    const budgetAdherencePct = prevExpenses > 0
      ? Math.round(Math.max(0, (1 - (realExpenses - prevExpenses) / prevExpenses)) * 100)
      : (realExpenses === 0 ? 100 : 50)

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
