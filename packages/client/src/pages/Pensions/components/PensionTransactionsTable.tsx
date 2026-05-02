import { EditOutlined } from '@ant-design/icons'
import ScrollableTable, { Column, Action } from 'components/ScrollableTable'
import { format } from 'utils'
import { PensionTransaction } from 'types'

const COLUMNS: Column<PensionTransaction>[] = [
  { id: 'date',          label: 'Fecha',          render: (t) => format.date(t.date) },
  { id: 'companyAmount', label: 'Empresa (€)',     render: (t) => format.euro(t.companyAmount), align: 'right' },
  { id: 'companyUnits',  label: 'Empresa (uds)',   field: 'companyUnits',                        align: 'right' },
  { id: 'employeeAmount',label: 'Empleado (€)',    render: (t) => format.euro(t.employeeAmount), align: 'right' },
  { id: 'employeeUnits', label: 'Empleado (uds)',  field: 'employeeUnits',                       align: 'right' },
  { id: 'value',         label: 'Valor ud.',       render: (t) => format.euro(t.value),          align: 'right' }
]

interface Props {
  transactions: PensionTransaction[]
  onEdit: (transaction: PensionTransaction) => void
}

const PensionTransactionsTable = ({ transactions, onEdit }: Props) => {
  const actions: Action<PensionTransaction>[] = [
    { icon: EditOutlined, tooltip: 'Editar', onClick: onEdit }
  ]

  return (
    <ScrollableTable
      title='Movimientos'
      cardSx={{ mt: 2 }}
      columns={COLUMNS}
      data={transactions}
      actions={actions}
      keyExtractor={(t, i) => t._id ?? String(i)}
    />
  )
}

export default PensionTransactionsTable
