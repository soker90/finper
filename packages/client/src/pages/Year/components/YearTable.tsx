import { Table, TableBody, TableCell, TableContainer, TableRow, useTheme } from '@mui/material'
import TableHeaderMonths from './TableHeaderMonths'
import { format } from 'utils'
import { Budget } from 'types/budget'
import { Theme } from '@emotion/react'

interface Props {
  data?: Budget[]
}

const YearTable = ({ data }: Props) => {
  const theme = useTheme() as Theme
  return (
    <TableContainer
      sx={{
        width: '100%',
        overflowX: 'auto',
        position: 'relative',
        display: 'block',
        maxWidth: '100%',
        '& td, & th': { whiteSpace: 'nowrap' }
      }}
    >
      <Table
        stickyHeader
        aria-labelledby='tableTitle'
        sx={{
          '& .MuiTableCell-root:first-child': {
            pl: 2
          },
          '& .MuiTableCell-root:last-child': {
            pr: 3
          }
        }}
      >
        <TableHeaderMonths />
        <TableBody sx={{ 'tr:last-child': { backgroundColor: theme.palette.primary.lighter } }}>
          {data?.filter(({ total }) => Boolean(total))?.map((row: Budget) => (
            <TableRow
              hover
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              key={row.name}
            >
              <TableCell component='td' id={row.name} scope='row' align='left'>
                {row.name}
              </TableCell>
              {
                                row.budgets.map((budget: any, index: number) => (
                                  <TableCell component='th' key={index} scope='row' align='left'>
                                    {format.euro(budget.real)}
                                  </TableCell>
                                ))
                            }
              <TableCell
                component='td' id={row.name} scope='row' align='left'
                sx={{ backgroundColor: theme.palette.primary.lighter }}
              >
                {format.euro(row.total)}
              </TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default YearTable
