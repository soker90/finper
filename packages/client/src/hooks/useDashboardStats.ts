import { useMemo } from 'react'
import useSWR from 'swr'
import { Transaction, TransactionType } from 'types'
import { TRANSACTIONS, DEBTS, ACCOUNTS } from 'constants/api-paths'

export interface MonthlyData {
  month: string
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

export interface DashboardStats {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  netWorth: number
  totalDebts: number
  savingsRate: number
  accountsBalance: Array<{ name: string; balance: number; bank: string }>
  topExpenseCategories: Array<{ name: string; amount: number }>
  topStores: Array<{ name: string; amount: number }>
  recentTransactions: Transaction[]
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
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const sumIncome = (txs: Transaction[]) =>
  txs.filter(t => t.type === TransactionType.Income).reduce((s, t) => s + t.amount, 0)

const sumExpenses = (txs: Transaction[]) =>
  Math.abs(txs.filter(t => t.type === TransactionType.Expense).reduce((s, t) => s + t.amount, 0))

/**
 * Builds cumulative daily expense arrays for a given month's transactions.
 * Returns an array of { day, amount } where amount is the cumulative total up to that day.
 */
const buildDailyExpenses = (txs: Transaction[], daysInMonth: number): DailyExpense[] => {
  const dailyMap = new Map<number, number>()
  txs
    .filter(t => t.type === TransactionType.Expense)
    .forEach(t => {
      const day = new Date(t.date).getDate()
      dailyMap.set(day, (dailyMap.get(day) || 0) + Math.abs(t.amount))
    })

  const result: DailyExpense[] = []
  let cumulative = 0
  for (let d = 1; d <= daysInMonth; d++) {
    cumulative += dailyMap.get(d) || 0
    result.push({ day: d, amount: Math.round(cumulative * 100) / 100 })
  }
  return result
}

export const useDashboardStats = (): {
  stats: DashboardStats | null
  loading: boolean
  error: any
  retry: () => void
} => {
  const { data: accounts, error: accountsError, mutate: mutateAccounts } = useSWR(ACCOUNTS)
  const { data: transactions, error: transactionsError, mutate: mutateTransactions } = useSWR<Transaction[]>(TRANSACTIONS)
  const { data: debts, error: debtsError, mutate: mutateDebts } = useSWR(DEBTS)

  const stats = useMemo(() => {
    const safeAccounts = Array.isArray(accounts) ? accounts : []
    const safeTransactions = Array.isArray(transactions) ? transactions : []
    const safeDebts = Array.isArray(debts) ? debts : []

    if (safeAccounts.length === 0 && safeTransactions.length === 0) return null

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear

    const currentMonthTransactions = safeTransactions.filter(t => {
      const d = new Date(t.date)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })

    const previousMonthTransactions = safeTransactions.filter(t => {
      const d = new Date(t.date)
      return d.getMonth() === previousMonth && d.getFullYear() === previousYear
    })

    const currentMonthIncome = sumIncome(currentMonthTransactions)
    const currentMonthExpenses = sumExpenses(currentMonthTransactions)
    const previousMonthIncome = sumIncome(previousMonthTransactions)
    const previousMonthExpenses = sumExpenses(previousMonthTransactions)

    const totalBalance = safeAccounts.reduce((s: number, a: any) => s + (a.balance || 0), 0)
    const totalDebts = safeDebts.reduce((s: number, d: any) => s + d.amount, 0)
    const netWorth = totalBalance - totalDebts

    const savingsRate =
      currentMonthIncome > 0
        ? Math.round(((currentMonthIncome - currentMonthExpenses) / currentMonthIncome) * 10000) / 100
        : 0

    const accountsBalance = safeAccounts
      .map((a: any) => ({ name: a.name, balance: a.balance || 0, bank: a.bank || 'Sin especificar' }))
      .sort((a: any, b: any) => b.balance - a.balance)

    // Top expense categories
    const expensesByCategory = new Map<string, number>()
    currentMonthTransactions
      .filter(t => t.type === TransactionType.Expense)
      .forEach(t => {
        const name = t.category?.name || 'Sin categoría'
        expensesByCategory.set(name, (expensesByCategory.get(name) || 0) + Math.abs(t.amount))
      })

    const topExpenseCategories = Array.from(expensesByCategory.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // Top stores
    const expensesByStore = new Map<string, number>()
    currentMonthTransactions
      .filter(t => t.type === TransactionType.Expense && t.store?.name)
      .forEach(t => {
        const name = t.store!.name
        expensesByStore.set(name, (expensesByStore.get(name) || 0) + Math.abs(t.amount))
      })

    const topStores = Array.from(expensesByStore.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    const recentTransactions = [...safeTransactions]
      .sort((a, b) => b.date - a.date)
      .slice(0, 8)

    // Last 6 months
    const last6Months: MonthlyData[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1)
      const m = d.getMonth()
      const y = d.getFullYear()
      const monthTxs = safeTransactions.filter(t => {
        const td = new Date(t.date)
        return td.getMonth() === m && td.getFullYear() === y
      })
      last6Months.push({
        month: MONTH_NAMES[m],
        income: sumIncome(monthTxs),
        expenses: sumExpenses(monthTxs)
      })
    }

    // Daily average expense & projection
    const dayOfMonth = now.getDate()
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const dailyAvgExpense = dayOfMonth > 0 ? currentMonthExpenses / dayOfMonth : 0
    const projectedMonthlyExpense = dailyAvgExpense * daysInCurrentMonth

    // Cash runway (months of expenses covered by balance)
    // Use average of last 3 months with data for more stable estimate
    const last3MonthsExpenses = last6Months.slice(-3).map(m => m.expenses).filter(e => e > 0)
    const avgMonthlyExpense = last3MonthsExpenses.length > 0
      ? last3MonthsExpenses.reduce((s, e) => s + e, 0) / last3MonthsExpenses.length
      : currentMonthExpenses
    const cashRunwayMonths = avgMonthlyExpense > 0
      ? Math.round((totalBalance / avgMonthlyExpense) * 10) / 10
      : 0

    // Expense velocity: cumulative daily expenses for current vs previous month
    const daysInPrevMonth = new Date(previousYear, previousMonth + 1, 0).getDate()
    const expenseVelocity = {
      currentMonth: buildDailyExpenses(currentMonthTransactions, daysInCurrentMonth),
      previousMonth: buildDailyExpenses(previousMonthTransactions, daysInPrevMonth)
    }

    return {
      totalBalance,
      monthlyIncome: currentMonthIncome,
      monthlyExpenses: currentMonthExpenses,
      netWorth,
      totalDebts,
      savingsRate,
      accountsBalance,
      topExpenseCategories,
      topStores,
      recentTransactions,
      monthlyTrend: {
        income: { current: currentMonthIncome, previous: previousMonthIncome },
        expenses: { current: currentMonthExpenses, previous: previousMonthExpenses }
      },
      last6Months,
      dailyAvgExpense,
      projectedMonthlyExpense,
      cashRunwayMonths,
      expenseVelocity
    }
  }, [accounts, transactions, debts])

  const loading = accounts === undefined || transactions === undefined || debts === undefined
  const error = accountsError || transactionsError || debtsError

  const retry = () => {
    mutateAccounts()
    mutateTransactions()
    mutateDebts()
  }

  return { stats, loading, error, retry }
}
