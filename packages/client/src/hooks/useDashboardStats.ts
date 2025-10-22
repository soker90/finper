import { useMemo } from 'react'
import useSWR from 'swr'
import { Account, Transaction, Category, Debt, TransactionType } from 'types'

interface DashboardStats {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  netWorth: number
  totalDebts: number
  savingsRate: number
  accountsBalance: Array<{ name: string; balance: number; bank: string }>
  topExpenseCategories: Array<{ name: string; amount: number }>
  recentTransactions: Transaction[]
  monthlyTrend: {
    income: { current: number; previous: number }
    expenses: { current: number; previous: number }
  }
}

export const useDashboardStats = (): {
  stats: DashboardStats | null
  loading: boolean
  error: any
} => {
  const { data: accounts, error: accountsError } = useSWR<Account[]>('accounts')
  const { data: transactions, error: transactionsError } = useSWR<Transaction[]>('transactions')
  const { data: categories, error: categoriesError } = useSWR<Category[]>('categories')
  const { data: debts, error: debtsError } = useSWR<Debt[]>('debts')

  const stats = useMemo(() => {
    // Asegurar que todos los datos son arrays válidos
    const safeAccounts = Array.isArray(accounts) ? accounts : []
    const safeTransactions = Array.isArray(transactions) ? transactions : []
    const safeDebts = Array.isArray(debts) ? debts : []

    // Si no tenemos datos mínimos, retornar null
    if (safeAccounts.length === 0 && safeTransactions.length === 0) return null

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear

    // Filtrar transacciones del mes actual y anterior
    const currentMonthTransactions = safeTransactions.filter(t => {
      const date = new Date(t.date)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })

    const previousMonthTransactions = safeTransactions.filter(t => {
      const date = new Date(t.date)
      return date.getMonth() === previousMonth && date.getFullYear() === previousYear
    })

    // Calcular ingresos y gastos del mes actual
    const currentMonthIncome = currentMonthTransactions
      .filter(t => t.type === TransactionType.Income)
      .reduce((sum, t) => sum + t.amount, 0)

    const currentMonthExpenses = Math.abs(currentMonthTransactions
      .filter(t => t.type === TransactionType.Expense)
      .reduce((sum, t) => sum + t.amount, 0))

    // Calcular ingresos y gastos del mes anterior
    const previousMonthIncome = previousMonthTransactions
      .filter(t => t.type === TransactionType.Income)
      .reduce((sum, t) => sum + t.amount, 0)

    const previousMonthExpenses = Math.abs(previousMonthTransactions
      .filter(t => t.type === TransactionType.Expense)
      .reduce((sum, t) => sum + t.amount, 0))

    // Balance total de cuentas
    const totalBalance = safeAccounts.reduce((sum, account) => sum + (account.balance || 0), 0)

    // Total de deudas
    const totalDebts = safeDebts.reduce((sum, debt) => sum + debt.amount, 0)

    // Patrimonio neto
    const netWorth = totalBalance - totalDebts

    // Tasa de ahorro
    const savingsRate = currentMonthIncome > 0
      ? ((currentMonthIncome - currentMonthExpenses) / currentMonthIncome) * 100
      : 0

    // Balance por cuenta (filtrar todas las cuentas activas)
    const accountsBalance = safeAccounts
      .map(account => ({
        name: account.name,
        balance: account.balance || 0,
        bank: account.bank || 'Sin especificar'
      }))
      .sort((a, b) => b.balance - a.balance)

    // Top categorías de gastos del mes actual
    const expensesByCategory = new Map<string, number>()
    currentMonthTransactions
      .filter(t => t.type === TransactionType.Expense)
      .forEach(t => {
        const categoryName = t.category?.name || 'Sin categoría'
        expensesByCategory.set(categoryName, (expensesByCategory.get(categoryName) || 0) + Math.abs(t.amount))
      })

    const topExpenseCategories = Array.from(expensesByCategory.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // Transacciones recientes
    const recentTransactions = [...safeTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)

    return {
      totalBalance,
      monthlyIncome: currentMonthIncome,
      monthlyExpenses: currentMonthExpenses,
      netWorth,
      totalDebts,
      savingsRate: Math.round(savingsRate * 100) / 100,
      accountsBalance,
      topExpenseCategories,
      recentTransactions,
      monthlyTrend: {
        income: { current: currentMonthIncome, previous: previousMonthIncome },
        expenses: { current: currentMonthExpenses, previous: previousMonthExpenses }
      }
    }
  }, [accounts, transactions, categories, debts])

  const loading = accounts === undefined || transactions === undefined || categories === undefined || debts === undefined
  const error = accountsError || transactionsError || categoriesError || debtsError

  return { stats, loading, error }
}
