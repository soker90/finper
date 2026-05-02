import { TableMaterial } from '@soker90/react-mui-table'
import { Grid, Box } from '@mui/material'
import { DeleteOutlined, EditOutlined, EuroOutlined } from '@ant-design/icons'

import { format } from 'utils'
import { Debt } from 'types/debt'

interface Props {
  debts: Debt[]
  title: string
  fromTitle: string
  onEdit: (debt: Debt) => void
  onRemove: (debt: Debt) => void
  onPay: (debt: Debt) => void
}

const DebtTable = ({ debts, title, fromTitle, onEdit, onRemove, onPay }: Props) => (
  <Grid size={{ xs: 12, lg: 6 }}>
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <TableMaterial
        columns={[
          { title: fromTitle, field: 'from' },
          { title: 'Fecha', render: ({ date }) => format.dateShort(date) },
          { title: 'Pendiente', render: ({ amount }) => format.euro(amount) },
          { title: 'Concepto', field: 'concept' }
        ]}
        data={debts}
        title={title}
        actions={[{
          icon: EuroOutlined,
          tooltip: 'Abonar',
          onClick: onPay
        },
        {
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
    </Box>
  </Grid>
)

export default DebtTable
