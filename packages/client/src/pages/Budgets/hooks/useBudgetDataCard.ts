import { Budget } from 'types/budget'
import { useMemo } from 'react'

interface TotalReturn {
    total: number,
    estimated: number,
    percentage: number,
    isPositive: boolean
}

export const useBudgetDataCard = ({ expenses, incomes }: { expenses: Budget[], incomes: Budget[] }): {
    expensesTotal: TotalReturn, incomesTotal: TotalReturn, balancePercentage: number,
} => {
  const expensesTotal = useMemo(() => {
    const total = expenses?.reduce((sum, { budgets }) => sum + budgets?.[0]?.real, 0) ?? 0
    const estimated = expenses?.reduce((sum, { budgets }) => sum + budgets?.[0]?.amount, 0) ?? 0
    return {
      total,
      estimated,
      percentage: (total / estimated) * 100,
      isPositive: total <= estimated
    }
  }, [expenses])

  const incomesTotal = useMemo(() => {
    const total = incomes?.reduce((sum, { budgets }) => sum + budgets?.[0]?.real, 0) ?? 0
    const estimated = incomes?.reduce((sum, { budgets }) => sum + budgets?.[0]?.amount, 0) ?? 0
    return {
      total,
      estimated,
      percentage: (total / estimated) * 100,
      isPositive: total >= estimated
    }
  }, [incomes])

  const balanceTotal = incomesTotal.total - expensesTotal.total
  const balanceEstimated = incomesTotal.estimated - expensesTotal.estimated
  const balancePercentage = (balanceTotal / balanceEstimated) * 100

  return {
    expensesTotal,
    incomesTotal,
    balancePercentage
  }
}
