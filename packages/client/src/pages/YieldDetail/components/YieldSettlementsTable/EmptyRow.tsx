import { TableRow, TableCell, Typography } from '@mui/material'

type Props = {
  colSpan: number
  message: string
}

const EmptyRow = ({ colSpan, message }: Props) => (
  <TableRow>
    <TableCell colSpan={colSpan} align='center' sx={{ py: 3 }}>
      <Typography color='textSecondary'>{message}</Typography>
    </TableCell>
  </TableRow>
)

export default EmptyRow
