import { useMemo, useState } from 'react'
import { Grid } from '@mui/material'
import { EditOutlined } from '@ant-design/icons'
import ScrollableTable, { Column, Action } from 'components/ScrollableTable'
import { format } from 'utils/index'
import ModalEdit from './ModalEdit'
import { Budget } from 'types/budget'
import { sortByAmountAndName } from '../utils'

const COLUMNS: Column<Budget>[] = [
  { id: 'name',      label: 'Categoría', field: 'name' },
  { id: 'real',      label: 'Real',      render: (b) => format.euro(b.budgets[0].real),   align: 'right' },
  { id: 'estimated', label: 'Estimado',  render: (b) => format.euro(b.budgets[0].amount), align: 'right' }
]

const BudgetTable = ({
  budgets,
  title,
  year,
  month
}: { budgets: Budget[], title: string, year: string, month: string }) => {
  const orderBudgets = useMemo(() => budgets.toSorted(sortByAmountAndName), [budgets])
  const [selectedBudget, setSelectedBudget] = useState<{ category: string, amount: number } | null>(null)

  const handleEdit = (item: Budget) => {
    setSelectedBudget({ category: item.id, amount: item?.budgets?.[0]?.amount })
  }
  const handleCloseEdit = () => setSelectedBudget(null)

  const actions: Action<Budget>[] = [
    { icon: EditOutlined, tooltip: 'Editar', onClick: handleEdit }
  ]

  return (
    <>
      <Grid size={{ xs: 12, lg: 6 }}>
        <ScrollableTable
          title={title}
          columns={COLUMNS}
          data={orderBudgets}
          actions={actions}
          keyExtractor={(b) => b.id}
        />
        {selectedBudget && (
          <ModalEdit onClose={handleCloseEdit} budget={selectedBudget} month={month} year={year} />
        )}
      </Grid>
    </>
  )
}

export default BudgetTable
