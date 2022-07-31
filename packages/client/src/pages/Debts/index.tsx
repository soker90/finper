import { Grid } from '@mui/material'
import { useDebts } from './hooks'
import MuiTable from '@soker90/react-mui-table'
import { format } from 'utils'
import { DebtCard } from './components'

const DashboardDefault = () => {
  const { from, to, debtsByPerson } = useDebts()
  return (
        <>
            <Grid container spacing={3} mb={2}>
                {debtsByPerson.map(debt => (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={debt._id}>
                        <DebtCard person={debt._id} amount={debt.total}/>
                    </Grid>
                ))}
            </Grid>
            <Grid container spacing={3}>
                <Grid item xs={12} lg={6}>
                    <MuiTable
                        columns={[
                          { title: 'De', field: 'from' },
                          { title: 'Fecha', render: ({ date }) => format.dateShort(date) },
                          { title: 'Cantidad', render: ({ amount }) => format.euro(amount) },
                          { title: 'Concepto', field: 'concept' },
                          { title: 'F. Pago', render: ({ paymentDate }) => format.dateShort(paymentDate) || 'Pendiente' }
                        ]}
                        data={from}
                        title='Me deben'
                    />
                </Grid>
                <Grid item xs={12} lg={6}>
                    <MuiTable
                        columns={[
                          { title: 'A', field: 'from' },
                          { title: 'Fecha', render: ({ date }) => format.dateShort(date) },
                          { title: 'Cantidad', render: ({ amount }) => format.euro(amount) },
                          { title: 'Concepto', field: 'concept' },
                          { title: 'F. Pago', render: ({ paymentDate }) => format.dateShort(paymentDate) }
                        ]}
                        data={to}
                        title='Debo'
                    />
                </Grid>
            </Grid>
        </>
  )
}

export default DashboardDefault
