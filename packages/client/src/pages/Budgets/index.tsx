import { useParams } from 'react-router-dom'
import { Grid } from '@mui/material'
import { TableMaterial } from '@soker90/react-mui-table'
import { useBudgets } from './hooks'
import { format } from 'utils'

const Budgets = () => {
  const { year, month } = useParams()
  const { expenses, incomes } = useBudgets({ year, month })

  return (
        <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
                <TableMaterial
                    columns={[
                      { title: 'Categoría', render: ({ name }) => name },
                      { title: 'Real', render: ({ budgets }) => format.euro(budgets[0].real) },
                      { title: 'Estimado', render: ({ budgets }) => format.euro(budgets[0].amount) }
                    ]}
                    data={expenses}
                    title={'Gastos'}
                />
            </Grid>
            <Grid item xs={12} lg={6}>
                <TableMaterial
                    columns={[
                      { title: 'Categoría', render: ({ name }) => name },
                      { title: 'Real', render: ({ budgets }) => format.euro(budgets[0].real) },
                      { title: 'Estimado', render: ({ budgets }) => format.euro(budgets[0].amount) }
                    ]}
                    data={incomes}
                    title={'Ingresos'}
                />
            </Grid>
        </Grid>
  )
}

export default Budgets
