import { Grid } from '@mui/material'
import { IconButton, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material'
import { EditOutlined } from '@ant-design/icons'
import { useMemo, useState } from 'react'
import { ScrollableTable } from 'components'
import { format } from 'utils/index'
import ModalEdit from './ModalEdit'
import { Budget } from 'types/budget'
import { sortByAmountAndName } from '../utils'

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

  return (
    <>
      <Grid size={{ xs: 12, lg: 6 }}>
        <ScrollableTable title={title}>
          <TableHead>
            <TableRow>
              <TableCell>Categoría</TableCell>
              <TableCell align='right'>Real</TableCell>
              <TableCell align='right'>Estimado</TableCell>
              <TableCell align='right'>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orderBudgets.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={4} align='center'>
                    <Typography color='text.secondary' py={2}>No se han encontrado datos</Typography>
                  </TableCell>
                </TableRow>
                )
              : orderBudgets.map((item) => (
                <TableRow hover key={item.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell align='right'>{format.euro(item.budgets[0].real)}</TableCell>
                  <TableCell align='right'>{format.euro(item.budgets[0].amount)}</TableCell>
                  <TableCell align='right'>
                    <Tooltip title='Editar'>
                      <IconButton size='large' onClick={() => handleEdit(item)}>
                        <EditOutlined />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </ScrollableTable>
        {selectedBudget && <ModalEdit onClose={handleCloseEdit} budget={selectedBudget} month={month} year={year} />}
      </Grid>
    </>
  )
}

export default BudgetTable
