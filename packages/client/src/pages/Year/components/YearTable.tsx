import { Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material'
import TableHeaderMonths from './TableHeaderMonths'
import { format } from 'utils'
import { Budget } from 'types/budget'

interface Props {
    data?: Budget[]
}

const YearTable = ({ data }: Props) => {
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
                aria-labelledby="tableTitle"
                sx={{
                  '& .MuiTableCell-root:first-child': {
                    pl: 2
                  },
                  '& .MuiTableCell-root:last-child': {
                    pr: 3
                  }
                }}
            >
                <TableHeaderMonths/>
                <TableBody>
                    {data?.map((row: Budget) => (
                        <TableRow
                            hover
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            key={row.name}
                        >
                            <TableCell component="th" id={row.name} scope="row" align="left">
                                {row.name}
                            </TableCell>
                            {
                                row.budgets.map((budget: any, index: number) => (
                                    <TableCell component="th" key={index} scope="row" align="left">
                                        {format.euro(budget.real)}
                                    </TableCell>
                                ))
                            }

                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
  )
}

export default YearTable
