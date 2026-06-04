import { roundNumber } from '../../utils/roundNumber'
import { db } from '../../db'
import { debtsService } from '../debts/debts.service'
import { createPensionsRepository } from '../pensions/pensions.repository'
import { PensionsService } from '../pensions/pensions.service'
import { computeHealthScore, computeBudgetAdherence, computeHistoricalSavingsRate } from './utils/health-score'
import { computeFilteredAvgMonthlyExpense } from './utils/cash-runway'
import { generateInsights } from './utils/insights'
import type { DashboardStatsResult, DailyExpense, PensionSummary } from './dashboard.types'

type IDashboardRepository = ReturnType<typeof import('./dashboard.repository').createDashboardRepository>

/** Construye el array acumulado de gasto diario a partir de un mapa día→importe. */
const buildCumulativeDailyExpenses = (dailyMap: Map<number, number>, daysInMonth: number): DailyExpense[] => {
  const result: DailyExpense[] = []
  let cumulative = 0
  for (let d = 1; d <= daysInMonth; d++) {
    cumulative += dailyMap.get(d) ?? 0
    result.push({ day: d, amount: roundNumber(cumulative) })
  }
  return result
}

export class DashboardService {
  constructor (private repository: IDashboardRepository) {}

  async getStats ({ user }: { user: string }): Promise<DashboardStatsResult> {
    const pensionsService = new PensionsService(createPensionsRepository(db))
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-indexed
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear

    const currentMonthStart = new Date(currentYear, currentMonth, 1).getTime()
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 1).getTime()
    const previousMonthStart = new Date(previousYear, previousMonth, 1).getTime()
    const previousMonthEnd = new Date(currentYear, currentMonth, 1).getTime()
    const last3MonthsStart = new Date(currentYear, currentMonth - 3, 1).getTime()
    const last6MonthsStart = new Date(currentYear, currentMonth - 5, 1).getTime()

    const repo = this.repository

    const [debtsResult, pensionData] = await Promise.all([
      debtsService.getDebts(user),
      pensionsService.getPensions(user)
    ])

    // Agregaciones (SQLite, síncronas)
    const totalBalance = repo.sumActiveAccountsBalance(user)
    const totalLoansPending = repo.sumPendingLoans(user)
    const currentMonthAgg = repo.monthIncomeExpenses(user, currentMonthStart, currentMonthEnd)
    const previousMonthAgg = repo.monthIncomeExpenses(user, previousMonthStart, previousMonthEnd)
    const last6MonthsAgg = repo.last6MonthsSummary(user, last6MonthsStart, currentMonthEnd)
    const currentVelocityAgg = repo.dailyExpenses(user, currentMonthStart, currentMonthEnd)
    const previousVelocityAgg = repo.dailyExpenses(user, previousMonthStart, previousMonthEnd)
    const topCategoriesAgg = repo.topExpenseCategories(user, currentMonthStart, currentMonthEnd)
    const topStoresAgg = repo.topExpenseStores(user, currentMonthStart, currentMonthEnd)
    const realExpensesAgg = repo.realExpenses(user, currentMonthStart, currentMonthEnd)
    const currentMonthByCategoryAgg = repo.currentMonthByCategory(user, currentMonthStart, currentMonthEnd)
    const last3MonthsByCategoryAgg = repo.last3MonthsAvgByCategory(user, last3MonthsStart, currentMonthEnd)
    const last3MonthsTransactionsAgg = repo.last3MonthsTransactions(user, last3MonthsStart, currentMonthStart)
    const currentBudgetsAgg = repo.currentBudgets(user, currentYear, currentMonth + 1)

    // Debts
    const totalOwed = debtsResult.to.reduce((sum: number, d: any) => sum + d.amount, 0)
    const totalReceiv = debtsResult.from.reduce((sum: number, d: any) => sum + d.amount, 0)
    const totalDebts = roundNumber(totalOwed)
    const totalReceivable = roundNumber(totalReceiv)

    const netWorth = roundNumber(totalBalance - totalDebts - totalLoansPending + totalReceivable)

    const monthlyIncome = roundNumber(currentMonthAgg.income)
    const monthlyExpenses = roundNumber(currentMonthAgg.expenses)
    const prevIncome = roundNumber(previousMonthAgg.income)
    const prevExpenses = roundNumber(previousMonthAgg.expenses)

    const savingsRate = monthlyIncome > 0
      ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 10000) / 100
      : 0

    const historicalSavingsRate = computeHistoricalSavingsRate({
      last6Months: last6MonthsAgg,
      currentMonthIndex: currentMonth,
      currentYear,
      fallback: savingsRate
    })

    // Expense velocity
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const daysInPreviousMonth = new Date(previousYear, previousMonth + 1, 0).getDate()

    const currentVelocityMap = new Map<number, number>(currentVelocityAgg.map(e => [e._id, e.amount]))
    const previousVelocityMap = new Map<number, number>(previousVelocityAgg.map(e => [e._id, e.amount]))

    const expenseVelocity = {
      currentMonth: buildCumulativeDailyExpenses(currentVelocityMap, daysInCurrentMonth),
      previousMonth: buildCumulativeDailyExpenses(previousVelocityMap, daysInPreviousMonth)
    }

    const dayOfMonth = now.getDate()
    const dailyAvgExpense = dayOfMonth > 0 ? roundNumber(monthlyExpenses / dayOfMonth) : 0
    const projectedMonthlyExpense = roundNumber(dailyAvgExpense * daysInCurrentMonth)

    const filteredAvgMonthlyExpense = computeFilteredAvgMonthlyExpense(last3MonthsTransactionsAgg, monthlyExpenses)
    const cashRunwayMonths = filteredAvgMonthlyExpense > 0
      ? Math.round((totalBalance / filteredAvgMonthlyExpense) * 10) / 10
      : 0

    const topExpenseCategories = topCategoriesAgg.filter(c => c.amount > 0)
    const topStores = topStoresAgg.filter(s => s.amount > 0)

    // Pension
    let pension: PensionSummary | null = null
    let pensionReturnPct = 0
    if (pensionData && pensionData.transactions.length > 0) {
      const pensionTotal = pensionData.total
      const pensionContributed = pensionData.amount
      pensionReturnPct = pensionContributed > 0
        ? Math.round(((pensionTotal - pensionContributed) / pensionContributed) * 10000) / 100
        : 0
      pension = {
        employeeAmount: roundNumber(pensionData.employeeAmount),
        companyAmount: roundNumber(pensionData.companyAmount),
        total: roundNumber(pensionTotal),
        transactions: pensionData.transactions as any[]
      }
    }

    // Budget adherence
    const totalBudgetAmount = currentBudgetsAgg.reduce((sum, b) => sum + b.amount, 0)
    const budgetAdherencePct = computeBudgetAdherence(realExpensesAgg, totalBudgetAmount, prevExpenses)

    // Health Score
    const healthScore = computeHealthScore(
      historicalSavingsRate,
      totalDebts + totalLoansPending,
      totalBalance,
      budgetAdherencePct,
      cashRunwayMonths,
      pensionReturnPct
    )

    // Insights
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
