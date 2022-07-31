import { Grid } from '@mui/material'
import { useDebts } from './hooks'
import MuiTable from '@soker90/react-mui-table'
import { format } from 'utils'

const DashboardDefault = () => {
  const { debts } = useDebts()
  return (<Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
            <MuiTable
                columns={[
                  { title: 'De', field: 'from' },
                  { title: 'Fecha', render: ({ date }) => format.dateShort(date) },
                  { title: 'Cantidad', render: ({ amount }) => format.euro(amount) },
                  { title: 'Concepto', field: 'concept' },
                  { title: 'F. Pago', render: ({ paymentDate }) => format.dateShort(paymentDate) }
                ]}
                data={debts}
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
                data={debts}
                title='Debo'
            />
        </Grid>
    </Grid>)
}

export default DashboardDefault
