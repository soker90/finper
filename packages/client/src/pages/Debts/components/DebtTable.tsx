import { Grid } from '@mui/material'
import { DeleteOutlined, EditOutlined, EuroOutlined } from '@ant-design/icons'
import ScrollableTable, { Column, Action } from 'components/ScrollableTable'
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

const DebtTable = ({ debts, title, fromTitle, onEdit, onRemove, onPay }: Props) => {
  const columns: Column<Debt>[] = [
    { id: 'from', label: fromTitle },
    { id: 'date', label: 'Fecha', render: (d) => format.dateShort(d.date) },
    { id: 'amount', label: 'Pendiente', render: (d) => format.euro(d.amount), align: 'right' },
    { id: 'concept', label: 'Concepto', field: 'concept' }
  ]

  const actions: Action<Debt>[] = [
    { icon: EuroOutlined, tooltip: 'Abonar', onClick: onPay },
    { icon: EditOutlined, tooltip: 'Editar', onClick: onEdit },
    { icon: DeleteOutlined, tooltip: 'Eliminar', onClick: onRemove, color: 'error' }
  ]

  return (
    <Grid size={{ xs: 12, lg: 6 }}>
      <ScrollableTable
        title={title}
        columns={columns}
        data={debts}
        actions={actions}
        keyExtractor={(d) => d._id ?? d.from}
      />
    </Grid>
  )
}

export default DebtTable
