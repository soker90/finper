import { TableCell, TableHead, TableRow } from '@mui/material'

const MONTHS = [
  'Categoria',
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
  'Totales'
]

const TableHeaderMonths = () => {
  return (
        <TableHead>
            <TableRow>
                {MONTHS.map((name) => (
                    <TableCell key={name}>
                        {name}
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
  )
}

export default TableHeaderMonths
