import { useParams } from 'react-router-dom'
import { Grid } from '@mui/material'
import { useBudgets, useBudgetDataCard } from './hooks'

import { BudgetCard, BudgetTable } from './components'
import Header from './components/Header'

const Budgets = () => {
  const { year, month } = useParams()
  const { expenses, incomes, totalsIncomes, totalsExpenses } = useBudgets({ year, month })
  const { expensesTotal, incomesTotal, balancePercentage } = useBudgetDataCard({ totalsIncomes, totalsExpenses })

  return (
        <>
            <Header month={month} year={year}/>
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <BudgetCard title='Gastos' total={expensesTotal.total} estimated={expensesTotal.estimated}
                                percentage={expensesTotal.percentage} color='warning'
                                isPositive={expensesTotal.isPositive} testId='expenses'/>
                </Grid>
                <Grid item xs={12} md={4}>
                    <BudgetCard title='Ingresos' total={incomesTotal.total} estimated={incomesTotal.estimated}
                                percentage={incomesTotal.percentage} color='success'
                                isPositive={incomesTotal.isPositive} testId='incomes'/>
                </Grid>
                <Grid item xs={12} md={4}>
                    <BudgetCard title='Balance' total={incomesTotal.total - expensesTotal.total}
                                estimated={incomesTotal.estimated - expensesTotal.estimated}
                                percentage={balancePercentage} isPositive={balancePercentage >= 100}
                                testId='total'/>
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
