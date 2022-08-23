import { useParams } from 'react-router-dom'
import { Grid } from '@mui/material'
import { useBudgets } from './hooks'
import { BudgetTable } from './components'

import Header from './components/Header'

const Budgets = () => {
  const { year, month } = useParams()
  const { expenses, incomes } = useBudgets({ year, month })

  return (
        <>
            <Header month={month} year={year}/>
            <Grid container spacing={3}>
                <BudgetTable budgets={expenses} title={'Gastos'}/>
                <BudgetTable budgets={incomes} title={'Ingresos'}/>
            </Grid>
        </>
  )
}

export default Budgets
