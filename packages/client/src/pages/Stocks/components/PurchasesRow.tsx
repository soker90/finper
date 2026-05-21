import { TableRow, TableCell, Box, Chip, IconButton } from '@mui/material'
import { DeleteOutlined } from '@ant-design/icons'
import { format } from 'utils'
import { StockPurchase } from 'types'

interface Props {
  purchase: StockPurchase
  onDelete: (id: string) => void
}

const PurchasesRow = ({ purchase, onDelete }: Props) => (
  <TableRow sx={{ bgcolor: 'action.hover' }}>
    <TableCell />
    <TableCell>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {format.date(purchase.date)}
        {purchase.type === 'dividend' && <Chip label='Dividendo' color='primary' size='small' variant='outlined' sx={{ height: 20, fontSize: '0.7rem' }} />}
      </Box>
    </TableCell>
    <TableCell align='right'>{format.number(purchase.shares, { maximumFractionDigits: 4 })}</TableCell>
    <TableCell align='right'>{format.euro(purchase.price)}</TableCell>
    <TableCell align='right'>{format.euro(purchase.shares * purchase.price)}</TableCell>
    <TableCell />
    <TableCell />
    <TableCell align='center'>
      <IconButton size='small' color='error' onClick={() => purchase._id && onDelete(purchase._id)}>
        <DeleteOutlined />
      </IconButton>
    </TableCell>
  </TableRow>
)

export default PurchasesRow
