import { useParams } from 'react-router'

import { useBudgetsYear } from './hooks'

import { Header, YearCard, YearTable } from './components'
import { Grid, Typography } from '@mui/material'
import { MainCard } from 'components'

const Budgets = () => {
  const { year } = useParams()
  const { expenses, incomes } = useBudgetsYear({ year })

  const balance = (incomes?.at?.(-1)?.total ?? 0) - (expenses?.at?.(-1)?.total ?? 0)

  return (
        <>
            <Header year={year ?? ''}/>
            <Grid container spacing={3} mb={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <YearCard title='Ingresos' data={incomes?.at?.(-1)?.total} color='info'/>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <YearCard title='Gastos' data={expenses?.at?.(-1)?.total} color='error'/>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <YearCard title='Balance' data={balance} color={balance < 0 ? 'warning' : 'success'}/>
                </Grid>
            </Grid>
            <Typography variant="h5">GASTOS</Typography>
            <MainCard sx={{ mt: 2 }} content={false}>
                <YearTable data={expenses}/>
            </MainCard>
            <Typography variant="h5" mt={2}>INGRESOS</Typography>
            <MainCard sx={{ mt: 2 }} content={false}>
                <YearTable data={incomes}/>
            </MainCard>

        </>
  )
}

export default Budgets
