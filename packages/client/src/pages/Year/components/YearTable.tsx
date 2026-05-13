import { TableBody, TableCell, TableRow, useTheme } from '@mui/material'
import TableHeaderMonths from './TableHeaderMonths'
import { ScrollableTable } from 'components'
import { format } from 'utils'
import { Budget } from 'types/budget'
import { Theme } from '@emotion/react'

interface Props {
  data?: Budget[]
}

const YearTable = ({ data }: Props) => {
  const theme = useTheme() as Theme
  return (
    <ScrollableTable
      stickyHeader
      sx={{
        '& .MuiTableCell-root:first-of-type': { pl: 2 },
        '& .MuiTableCell-root:last-of-type': { pr: 3 }
      }}
    >
      <TableHeaderMonths />
      <TableBody sx={{ 'tr:last-child': { backgroundColor: theme.palette.primary.lighter } }}>
        {data?.reduce<Budget[]>((acc, row) => {
          if (row.total) acc.push(row)
          return acc
        }, []).map((row: Budget) => (
          <TableRow
            hover
            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            key={row.name}
          >
            <TableCell component='td' id={row.name} scope='row' align='left'>
              {row.name}
            </TableCell>
            {row.budgets.map((budget: any) => (
              <TableCell component='th' key={`${row.name}-${budget.month ?? budget.year}`} scope='row' align='left'>
                {format.euro(budget.real)}
              </TableCell>
            ))}
            <TableCell
              component='td' id={row.name} scope='row' align='left'
              sx={{ backgroundColor: theme.palette.primary.lighter }}
            >
              {format.euro(row.total)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </ScrollableTable>
  )
}

export default YearTable
