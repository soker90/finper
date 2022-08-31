import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Grid } from '@mui/material'
import { useBudgets } from './hooks'

import { BudgetCard, BudgetTable } from './components'
import Header from './components/Header'

const Budgets = () => {
  const { year, month } = useParams()
  const { expenses, incomes } = useBudgets({ year, month })

  const expensesTotal = useMemo(() => {
    const total = expenses?.[0]?.budgets?.reduce((sum, expense) => sum + expense.real, 0) ?? 0
    const estimated = expenses?.[0]?.budgets?.reduce((sum, expense) => sum + expense.amount, 0) ?? 0
    return {
      total,
      estimated,
      percentage: (total / estimated) * 100,
      isPositive: total <= estimated
    }
  }, [expenses])

  const incomesTotal = useMemo(() => {
    const total = incomes?.[0]?.budgets?.reduce((sum, expense) => sum + expense.real, 0) ?? 0
    const estimated = incomes?.[0]?.budgets?.reduce((sum, expense) => sum + expense.amount, 0) ?? 0
    return {
      total,
      estimated,
      percentage: (total / estimated) * 100,
      isPositive: total <= estimated
    }
  }, [incomes])

  const balanceTotal = incomesTotal.total - expensesTotal.total
  const balanceEstimated = incomesTotal.estimated - expensesTotal.estimated
  const balancePercentage = (balanceTotal / balanceEstimated) * 100

  return (
        <>
            <Header month={month} year={year}/>
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <BudgetCard title='Gastos' total={expensesTotal.total} estimated={expensesTotal.estimated}
                                percentage={expensesTotal.percentage} color='warning'
                                isPositive={expensesTotal.isPositive}/>
                </Grid>
                <Grid item xs={12} md={4}>
                    <BudgetCard title='Ingresos' total={incomesTotal.total} estimated={incomesTotal.estimated}
                                percentage={incomesTotal.percentage} color='success'
                                isPositive={incomesTotal.isPositive}/>
                </Grid>
                <Grid item xs={12} md={4}>
                    <BudgetCard title='Balance' total={incomesTotal.total - expensesTotal.total}
                                estimated={incomesTotal.estimated - expensesTotal.estimated}
                                percentage={balancePercentage} isPositive={balancePercentage <= 100}/>
                </Grid>
                <BudgetTable budgets={expenses} title={'Gastos'}/>
                <BudgetTable budgets={incomes} title={'Ingresos'}/>
            </Grid>
        </>
  )
}

export default Budgets
