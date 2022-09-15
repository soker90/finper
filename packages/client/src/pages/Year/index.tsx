import { useParams } from 'react-router-dom'

import { useBudgetsYear } from './hooks'

import { Header, YearTable } from './components'
import { Typography } from '@mui/material'
import { MainCard } from 'components'

const Budgets = () => {
  const { year } = useParams()
  const { expenses, incomes } = useBudgetsYear({ year })

  return (
        <>
            <Header year={year ?? ''}/>
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
