import { Grid } from '@mui/material'
import { TableMaterial } from '@soker90/react-mui-table'
import { EditOutlined } from '@ant-design/icons'
import { useState } from 'react'

import { format } from 'utils/index'
import ModalEdit from './ModalEdit'
import { Budget } from 'types/budget'

const BudgetTable = ({ budgets, title, year, month }: { budgets: any, title: string, year: string, month: string }) => {
  const [selectedBudget, setSelectedBudget] = useState<{ category: string, amount: number } | null>(null)
  const handleEdit = (item: Budget) => {
    setSelectedBudget({
      category: item.id,
      amount: item?.budgets?.[0]?.amount
    })
  }
  const handleCloseEdit = () => {
    setSelectedBudget(null)
  }

  return (
        <>
            <Grid item xs={12} lg={6}>
                <TableMaterial
                    columns={[
                      { title: 'Categoría', field: 'name' },
                      { title: 'Real', render: ({ budgets }) => format.euro(budgets[0].real) },
                      { title: 'Estimado', render: ({ budgets }) => format.euro(budgets[0].amount) }
                    ]}
                    data={budgets}
                    title={title}
                    actions={[
                      {
                        onClick: handleEdit,
                        tooltip: 'Editar',
                        icon: EditOutlined
                      }
                    ]}
                />
            </Grid>
            {selectedBudget && <ModalEdit onClose={handleCloseEdit} budget={selectedBudget} month={month} year={year}/>}
        </>
  )
}

export default BudgetTable
