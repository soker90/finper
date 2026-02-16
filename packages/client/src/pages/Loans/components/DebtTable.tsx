import { TableMaterial } from '@soker90/react-mui-table'
import { Grid } from '@mui/material'

import { format } from 'utils'
import { Debt } from 'types/debt'

interface Props {
    debts: Debt[]
    title: string
    fromTitle: string
}

const DebtTable = ({ debts, title, fromTitle }: Props) => (
    <Grid item xs={12} lg={6}>
        <TableMaterial
            columns={[
              { title: fromTitle, field: 'from' },
              { title: 'Fecha', render: ({ date }) => format.dateShort(date) },
              { title: 'Cantidad', render: ({ amount }) => format.euro(amount) },
              { title: 'Concepto', field: 'concept' },
              { title: 'F. Pago', render: ({ paymentDate }) => format.dateShort(paymentDate) || 'Pendiente' }
            ]}
            data={debts}
            title={title}
        />
    </Grid>
)

export default DebtTable
