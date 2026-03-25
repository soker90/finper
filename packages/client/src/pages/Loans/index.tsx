import { Grid } from '@mui/material'
import { useLoans } from './hooks'
import { DebtCard, DebtTable } from './components'

const Debts = () => {
  const { from, to, debtsByPerson } = useLoans()
  return (
        <>
            <Grid container spacing={3} mb={2}>
                {debtsByPerson.map((debt) => (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={debt._id}>
                        <DebtCard person={debt._id} amount={debt.total}/>
                    </Grid>
                ))}
            </Grid>
            <Grid container spacing={3}>
                <DebtTable debts={from} title='Me deben' fromTitle='De'/>
                <DebtTable debts={to} title='Debo' fromTitle='A'/>
            </Grid>
        </>
  )
}

export default Debts
