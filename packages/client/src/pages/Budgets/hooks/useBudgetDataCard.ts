import { Budget } from 'types/budget'
import { useMemo } from 'react'

interface TotalReturn {
    total: number,
    estimated: number,
    percentage: number,
    isPositive: boolean
}

export const useBudgetDataCard = ({ totalsIncomes, totalsExpenses }: { totalsIncomes: Budget, totalsExpenses: Budget }): {
    expensesTotal: TotalReturn, incomesTotal: TotalReturn, balancePercentage: number,
} => {
  const expensesTotal = useMemo(() => {
    const total = totalsExpenses?.budgets?.[0]?.real ?? 0
    const estimated = totalsExpenses?.budgets?.[0]?.amount ?? 0
    return {
      total,
      estimated,
      percentage: (total / estimated) * 100,
      isPositive: total <= estimated
    }
  }, [totalsExpenses])

  const incomesTotal = useMemo(() => {
    const total = totalsIncomes?.budgets?.[0]?.real ?? 0
    const estimated = totalsIncomes?.budgets?.[0]?.amount ?? 0
    return {
      total,
      estimated,
      percentage: (total / estimated) * 100,
      isPositive: total >= estimated
    }
  }, [totalsIncomes])

  const balanceTotal = incomesTotal.total - expensesTotal.total
  const balanceEstimated = incomesTotal.estimated - expensesTotal.estimated
  const balancePercentage = (balanceTotal / balanceEstimated) * 100

  return {
    expensesTotal,
    incomesTotal,
    balancePercentage
  }
}
