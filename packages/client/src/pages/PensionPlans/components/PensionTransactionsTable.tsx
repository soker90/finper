import { useState } from 'react'
import { Button } from '@mui/material'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import ScrollableTable, { Column, Action } from 'components/ScrollableTable'
import { format } from 'utils'
import { PensionTransaction } from 'types'

const PAGE_SIZE = 20

const BASE_COLUMNS: Column<PensionTransaction>[] = [
  { id: 'date', label: 'Fecha', render: (t) => format.date(t.date) },
  { id: 'companyAmount', label: 'Empresa (€)', render: (t) => format.euro(t.companyAmount), align: 'right' },
  { id: 'companyUnits', label: 'Empresa (uds)', field: 'companyUnits', align: 'right' },
  { id: 'employeeAmount', label: 'Empleado (€)', render: (t) => format.euro(t.employeeAmount), align: 'right' },
  { id: 'employeeUnits', label: 'Empleado (uds)', field: 'employeeUnits', align: 'right' },
  { id: 'value', label: 'Valor ud.', render: (t) => format.euro(t.value), align: 'right' }
]

interface Props {
  transactions: PensionTransaction[]
  onEdit: (transaction: PensionTransaction) => void
  onDelete?: (transaction: PensionTransaction) => void
  /** When provided, adds a "Plan" column mapping each transaction's planId to a name — used when movements from several plans are shown together. */
  planNameById?: Record<string, string>
}

const PensionTransactionsTable = ({ transactions, onEdit, onDelete, planNameById }: Props) => {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [previousTransactions, setPreviousTransactions] = useState(transactions)

  if (transactions !== previousTransactions) {
    setPreviousTransactions(transactions)
    setVisibleCount(PAGE_SIZE)
  }
  const actions: Action<PensionTransaction>[] = [
    { icon: EditOutlined, tooltip: 'Editar', onClick: onEdit },
    ...(onDelete ? [{ icon: DeleteOutlined, tooltip: 'Eliminar', onClick: onDelete }] : [])
  ]

  const columns: Column<PensionTransaction>[] = planNameById
    ? [
        { id: 'plan', label: 'Plan', render: (t) => (t.planId ? planNameById[t.planId] ?? '—' : '—') },
        ...BASE_COLUMNS
      ]
    : BASE_COLUMNS

  const visibleTransactions = transactions.slice(0, visibleCount)
  const hasMore = visibleCount < transactions.length

  return (
    <>
      <ScrollableTable
        title='Movimientos'
        cardSx={{ mt: 2 }}
        columns={columns}
        data={visibleTransactions}
        actions={actions}
        keyExtractor={(t, i) => t._id ?? String(i)}
      />
      {hasMore && (
        <Button
          variant='outlined'
          fullWidth
          sx={{ mt: 2 }}
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
        >
          Cargar más
        </Button>
      )}
    </>
  )
}

export default PensionTransactionsTable
