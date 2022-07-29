import {
  Box, TableBody, TableCell, TableRow, Checkbox
} from '@mui/material'
import { Link } from 'react-router-dom'

import BodyActionsButtons from './components/BodyActionsButtons'
import { Column, Action } from '../../types'

interface BodyTableProps {
  columns: Column[];
  actions?: Action[];
  classes: any;
  data: any[];
  href?: any;
  onRowClick?: (row: any) => void;
  multiSelect?: (row: any) => boolean;
  onSelected?: any;
  rowClass?: (row: any) => string;
}

const BodyTable = ({
  data, onRowClick, columns, href, classes, actions, multiSelect, onSelected, rowClass
}: BodyTableProps) => (
  <TableBody>
    {data.map((row, index) => {
      const isSelected = multiSelect?.(row)
      return (
        <TableRow
          onMouseDown={() => onRowClick?.(row)}
          hover
          key={index}
          selected={isSelected}
          className={rowClass?.(row) || ''}
        >
          {Boolean(multiSelect) && (
            <TableCell padding='checkbox'>
              <Checkbox
                checked={isSelected}
                onChange={event => onSelected(event, row)}
                value={isSelected}
              />
            </TableCell>
          )}
          {columns.map(({ field, render }) => (
            <TableCell key={field}>
              <Box
                {...(href && {
                  component: Link,
                  to: href(row),
                  className: classes.cell
                })}
              >
                {render?.(row) || row[field as string]}
              </Box>
            </TableCell>
          ))}

          {actions &&
          (
            <BodyActionsButtons
              actions={actions}
              index={index}
              row={row}
            />
          )}
        </TableRow>
      )
    })}
  </TableBody>
)

export default BodyTable
