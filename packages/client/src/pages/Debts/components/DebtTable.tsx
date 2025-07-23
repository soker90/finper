import { TableMaterial } from '@soker90/react-mui-table'
import { Grid } from '@mui/material'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'

import { format } from 'utils'
import { Debt } from 'types/debt'

interface Props {
    debts: Debt[]
    title: string
    fromTitle: string
    onEdit: (debt: Debt) => void
    onRemove: (debt: Debt) => void
}

const DebtTable = ({ debts, title, fromTitle, onEdit, onRemove }: Props) => (
    <Grid size={{ xs: 12, lg: 6 }}>
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
            actions={[{
              icon: EditOutlined,
              tooltip: 'Editar',
              onClick: onEdit
            },
            {
              icon: DeleteOutlined,
              tooltip: 'Eliminar',
              onClick: onRemove
            }]}
        />
    </Grid>
)

export default DebtTable
