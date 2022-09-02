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

                {year &&
                  <>
                    <BudgetTable budgets={expenses} title={'Gastos'} year={year} month={month as string}/>
                    <BudgetTable budgets={incomes} title={'Ingresos'} year={year} month={month as string}/>
                  </>
                }
            </Grid>
        </>
  )
}

export default Budgets
