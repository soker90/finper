import { IconButton, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material'
import { EditOutlined } from '@ant-design/icons'
import { ScrollableTable } from 'components'
import { format } from 'utils'
import { PensionTransaction } from 'types'

const PensionTransactionsTable = ({ transactions, onEdit }: {
  transactions: PensionTransaction[],
  onEdit: (transaction: PensionTransaction) => void
}) => (
  <ScrollableTable title='Movimientos' cardSx={{ mt: 2 }}>
    <TableHead>
      <TableRow>
        <TableCell>Fecha</TableCell>
        <TableCell align='right'>Empresa (€)</TableCell>
        <TableCell align='right'>Empresa (uds)</TableCell>
        <TableCell align='right'>Empleado (€)</TableCell>
        <TableCell align='right'>Empleado (uds)</TableCell>
        <TableCell align='right'>Valor ud.</TableCell>
        <TableCell align='right'>Acciones</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {transactions.length === 0
        ? (
          <TableRow>
            <TableCell colSpan={7} align='center'>
              <Typography color='text.secondary' py={2}>No se han encontrado datos</Typography>
            </TableCell>
          </TableRow>
          )
        : transactions.map((t) => (
          <TableRow hover key={t._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
            <TableCell>{format.date(t.date)}</TableCell>
            <TableCell align='right'>{format.euro(t.companyAmount)}</TableCell>
            <TableCell align='right'>{t.companyUnits}</TableCell>
            <TableCell align='right'>{format.euro(t.employeeAmount)}</TableCell>
            <TableCell align='right'>{t.employeeUnits}</TableCell>
            <TableCell align='right'>{format.euro(t.value)}</TableCell>
            <TableCell align='right'>
              <Tooltip title='Editar'>
                <IconButton size='large' onClick={() => onEdit(t)}>
                  <EditOutlined />
                </IconButton>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}
    </TableBody>
  </ScrollableTable>
)

export default PensionTransactionsTable
