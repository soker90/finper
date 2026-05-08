import { Box, Chip, LinearProgress, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { TagCategoryBreakdown } from 'types'
import { format } from 'utils'

interface CategoryBreakdownTableProps {
  categories: TagCategoryBreakdown[]
  totalAmount: number
}

const CategoryBreakdownTable = ({ categories, totalAmount }: CategoryBreakdownTableProps) => {
  return (
    <Box>
      <Typography variant='h5' mb={2}>Desglose por categorías</Typography>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>Categoría</TableCell>
            <TableCell align='right'>Importe</TableCell>
            <TableCell align='right'>%</TableCell>
            <TableCell align='right'>Movimientos</TableCell>
            <TableCell>Distribución</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {categories.map((cat) => {
            const percentage = totalAmount > 0 ? (cat.amount / totalAmount) * 100 : 0
            return (
              <TableRow key={cat.categoryId}>
                <TableCell>{cat.categoryName}</TableCell>
                <TableCell align='right'>{format.euro(cat.amount)}</TableCell>
                <TableCell align='right'>{percentage.toFixed(1)}%</TableCell>
                <TableCell align='right'>
                  <Chip label={cat.count} size='small' />
                </TableCell>
                <TableCell sx={{ width: '30%' }}>
                  <LinearProgress
                    variant='determinate'
                    value={percentage}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Box>
  )
}

export default CategoryBreakdownTable
