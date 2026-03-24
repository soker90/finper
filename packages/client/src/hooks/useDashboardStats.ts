import useSWR from 'swr'
import { DASHBOARD_STATS } from 'constants/api-paths'

export interface MonthlyData {
  month: number   // 1-indexed
  year: number
  income: number
  expenses: number
}

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

export interface PensionTransaction {
  date: number
  employeeAmount: number
  employeeUnits: number
  companyAmount: number
  companyUnits: number
  value: number
}

export interface PensionSummary {
  employeeAmount: number
  companyAmount: number
  total: number
  transactions: PensionTransaction[]
}

export interface DashboardStats {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  netWorth: number
  totalDebts: number
  savingsRate: number
  topExpenseCategories: Array<{ name: string; amount: number }>
  topStores: Array<{ name: string; amount: number }>
  monthlyTrend: {
    income: { current: number; previous: number }
    expenses: { current: number; previous: number }
  }
  last6Months: MonthlyData[]
  dailyAvgExpense: number
  projectedMonthlyExpense: number
  cashRunwayMonths: number
  expenseVelocity: {
    currentMonth: DailyExpense[]
    previousMonth: DailyExpense[]
  }
  // Nuevos campos del backend
  pension: PensionSummary | null
  pensionReturnPct: number
  budgetAdherencePct: number
  healthScore: HealthScore
}

export const useDashboardStats = (): {
  stats: DashboardStats | null
  loading: boolean
  error: any
  retry: () => void
} => {
  const { data, error, mutate } = useSWR<DashboardStats>(DASHBOARD_STATS)

  const retry = () => { mutate() }

  return {
    stats: data ?? null,
    loading: data === undefined && !error,
    error,
    retry
  }
}
