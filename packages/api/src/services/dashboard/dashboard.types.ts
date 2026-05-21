import type { IPension } from '@soker90/finper-models'
import type { Insight, MonthlyData } from '../utils/insights'

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
