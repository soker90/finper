import { Chip, LinearProgress, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import { MainCard } from 'components'
import { TagCategoryBreakdown } from 'types'
import { format } from 'utils'
import { useChartColors } from '../../../Dashboard/components/shared'

interface CategoryBreakdownTableProps {
  categories: TagCategoryBreakdown[]
  totalAmount: number
}

const CategoryBreakdownTable = ({ categories, totalAmount }: CategoryBreakdownTableProps) => {
  const chartColors = useChartColors()

  return (
    <MainCard title='Desglose por categorías' divider>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>Categoría</TableCell>
            <TableCell align='right'>Importe</TableCell>
            <TableCell align='right'>%</TableCell>
            <TableCell align='right'>Mov.</TableCell>
            <TableCell>Distribución</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {categories.map((cat, index) => {
            const percentage = totalAmount > 0 ? (cat.amount / totalAmount) * 100 : 0
            const barColor = chartColors[index % chartColors.length]
            return (
              <TableRow key={cat.categoryId}>
                <TableCell>{cat.categoryName}</TableCell>
                <TableCell align='right'>{format.euro(cat.amount)}</TableCell>
                <TableCell align='right'>{percentage.toFixed(1)}%</TableCell>
                <TableCell align='right'>
                  <Chip label={cat.count} size='small' variant='outlined' />
                </TableCell>
                <TableCell sx={{ width: '30%' }}>
                  <LinearProgress
                    variant='determinate'
                    value={percentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'action.hover',
                      '& .MuiLinearProgress-bar': { bgcolor: barColor }
                    }}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </MainCard>
  )
}

export default CategoryBreakdownTable
