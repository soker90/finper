import { IconButton, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material'
import { Grid } from '@mui/material'
import { DeleteOutlined, EditOutlined, EuroOutlined } from '@ant-design/icons'
import { ScrollableTable } from 'components'
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
    <ScrollableTable title={title}>
      <TableHead>
        <TableRow>
          <TableCell>{fromTitle}</TableCell>
          <TableCell>Fecha</TableCell>
          <TableCell align='right'>Pendiente</TableCell>
          <TableCell>Concepto</TableCell>
          <TableCell align='right'>Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {debts.length === 0
          ? (
            <TableRow>
              <TableCell colSpan={5} align='center'>
                <Typography color='text.secondary' py={2}>No se han encontrado datos</Typography>
              </TableCell>
            </TableRow>
            )
          : debts.map((debt) => (
            <TableRow hover key={debt._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell>{debt.from}</TableCell>
              <TableCell>{format.dateShort(debt.date)}</TableCell>
              <TableCell align='right'>{format.euro(debt.amount)}</TableCell>
              <TableCell>{debt.concept}</TableCell>
              <TableCell align='right'>
                <Tooltip title='Abonar'>
                  <IconButton size='large' onClick={() => onPay(debt)}>
                    <EuroOutlined />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Editar'>
                  <IconButton size='large' onClick={() => onEdit(debt)}>
                    <EditOutlined />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Eliminar'>
                  <IconButton size='large' onClick={() => onRemove(debt)}>
                    <DeleteOutlined />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </ScrollableTable>
  </Grid>
)

export default DebtTable
