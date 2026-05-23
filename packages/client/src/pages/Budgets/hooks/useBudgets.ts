import useSWR from 'swr'
import { BUDGETS } from 'constants/api-paths'
import { objectToParams } from 'utils/objectToParams'
import { Budget } from 'types'

export interface RuleClassInfo {
  budgeted: number
  real: number
  percentageBudgeted: number
  percentageReal: number
}

export interface Rule503020Data {
  needs: RuleClassInfo
  wants: RuleClassInfo
  savings: RuleClassInfo
  totals: {
    incomeBudgeted: number
    incomeReal: number
  }
}

export const useBudgets = (filters: { year?: string, month?: string }): {
  expenses: Budget[],
  incomes: Budget[],
  isLoading: boolean,
  error: any,
  totalsIncomes: Budget,
  totalsExpenses: Budget,
  rule503020?: Rule503020Data
} => {
  const { data, error, isLoading } = useSWR(`${BUDGETS}${objectToParams(filters)}`)

  return {
    isLoading,
    error,
    incomes: data?.incomes?.filter?.(({ id }: Budget) => id !== 'totals') || [],
    expenses: data?.expenses?.filter?.(({ id }: Budget) => id !== 'totals') || [],
    totalsIncomes: data?.incomes?.find?.(({ id }: Budget) => id === 'totals') || {},
    totalsExpenses: data?.expenses?.find?.(({ id }: Budget) => id === 'totals') || {},
    rule503020: data?.rule503020
  }
}
