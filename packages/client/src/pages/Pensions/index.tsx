import { Grid } from '@mui/material'
import { usePensions } from './hooks'
import { PensionTransactionsTable, PensionStatCard } from './components'
import { STATS } from './constants'

const Pension = () => {
  const { pension } = usePensions()

  if (!pension) return null
  return (
        <>
            <Grid container spacing={3} mb={2}>
                {STATS.map((stat) => (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={stat.title}>
                        <PensionStatCard title={stat.title} amount={pension[stat.value]} currency={stat.currency}/>
                    </Grid>
                ))}
            </Grid>
            <PensionTransactionsTable transactions={pension.transactions}/>
        </>
  )
}

export default Pension
