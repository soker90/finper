import { TableCell, TableHead, TableRow } from '@mui/material'
import { Action, Column } from '../../types'

interface HeadTableProps {
    columns: Column[];
    actions?: Action[];
    multiSelect?: (row: object) => boolean;
}

const HeadTable = ({ columns, actions, multiSelect }: HeadTableProps) => (
    <TableHead sx={{ fontSize: 20 }}>
        <TableRow>
            {multiSelect && <TableCell/>}
            {columns.map(({ title }) => (
                <TableCell key={title}>
                    {title}
                </TableCell>
            ))}
            {actions &&
                (
                    <TableCell align='right'>
                        Acciones
                    </TableCell>
                )}
        </TableRow>
    </TableHead>
)

export default HeadTable
