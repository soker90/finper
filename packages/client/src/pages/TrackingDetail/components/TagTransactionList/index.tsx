import { Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { MainCard } from 'components'
import { Transaction } from 'types'
import { format } from 'utils'

const AMOUNT_COLORS: Record<string, string> = {
  expense: 'error.main',
  income: 'success.main',
  not_computable: 'text.secondary'
}

const TagTransactionList = ({ transactions }: { transactions: Transaction[] }) => {
  return (
    <MainCard title={`Movimientos (${transactions.length})`} divider>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell>
            <TableCell>Categoría</TableCell>
            <TableCell>Comercio</TableCell>
            <TableCell>Etiquetas</TableCell>
            <TableCell align='right'>Importe</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction._id} sx={{ '&:last-child td': { border: 0 } }}>
              <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                <Typography variant='body2'>{format.date(transaction.date)}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant='body2'>{transaction.category?.name}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant='body2' color='text.secondary'>
                  {transaction.store?.name ?? '—'}
                </Typography>
              </TableCell>
              <TableCell>
                {transaction.tags?.map((tag) => (
                  <Chip key={tag} label={tag} size='small' variant='outlined' sx={{ mr: 0.5 }} />
                ))}
              </TableCell>
              <TableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                <Typography
                  variant='body2'
                  sx={{ fontWeight: 600, color: AMOUNT_COLORS[transaction.type] ?? 'text.primary' }}
                >
                  {transaction.type === 'expense' ? '-' : '+'}{format.euro(transaction.amount)}
                </Typography>
                {transaction.note && (
                  <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                    {transaction.note}
                  </Typography>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </MainCard>
  )
}

export default TagTransactionList
