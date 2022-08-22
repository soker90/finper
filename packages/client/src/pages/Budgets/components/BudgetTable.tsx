import { Grid } from '@mui/material'
import { TableMaterial } from '@soker90/react-mui-table'

import { format } from 'utils/index'

const BudgetTable = ({ budgets, title }: {budgets: any, title: string}) => (
    <Grid item xs={12} lg={6}>
        <TableMaterial
            columns={[
              { title: 'Categoría', render: ({ name }) => name },
              { title: 'Real', render: ({ budgets }) => format.euro(budgets[0].real) },
              { title: 'Estimado', render: ({ budgets }) => format.euro(budgets[0].amount) }
            ]}
            data={budgets}
            title={title}
        />
    </Grid>
)

export default BudgetTable
