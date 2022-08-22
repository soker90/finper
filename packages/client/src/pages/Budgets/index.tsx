import { Link, useParams } from 'react-router-dom'
import { IconButton, Grid, Typography, Button } from '@mui/material'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { useBudgets } from './hooks'
import { BudgetTable } from './components'
import { InlineCenter } from 'components/index'
import { monthToNumber } from 'utils/format'

const Budgets = () => {
  const { year, month } = useParams()
  const { expenses, incomes } = useBudgets({ year, month })

  return (
        <>
            <Grid container spacing={3}>

                <Grid item>
                    <Button variant='outlined' disableElevation> ACTUAL</Button>
                </Grid>
                <Grid item xs={3}>
                    <InlineCenter>
                        <IconButton color="primary" aria-label='izquierda' size='large' component={Link} to='#'>
                            <LeftOutlined/>
                        </IconButton>
                        <Typography typography='h3'>{monthToNumber(month)} {year} </Typography>
                        <IconButton color="primary" aria-label='derecha' size='large' component={Link} to='#'>
                            <RightOutlined/>
                        </IconButton>
                    </InlineCenter>
                </Grid>

            </Grid>
            <Grid container spacing={3}>
                <BudgetTable budgets={expenses} title={'Gastos'}/>
                <BudgetTable budgets={incomes} title={'Ingresos'}/>
            </Grid>
        </>
  )
}

export default Budgets
