import { useMemo } from 'react'
import {
  IconButton,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { ScrollableTable } from 'components'
import { SupplyReading } from 'types'
import { getColumns } from './columns'

interface Props {
  readings: SupplyReading[]
  isLoading: boolean
  isElectricity: boolean
  unit: string
  onAdd: () => void
  onEdit: (reading: SupplyReading) => void
  onDelete: (reading: SupplyReading) => void
}

const SupplyReadingList = ({ readings, isLoading, isElectricity, unit, onAdd, onEdit, onDelete }: Props) => {
  const columns = useMemo(() => getColumns({ isElectricity, unit }), [isElectricity, unit])
  const colSpan = columns.length + 1

  const renderBody = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={colSpan} align='center'>
            <Typography color='text.secondary'>Cargando lecturas…</Typography>
          </TableCell>
        </TableRow>
      )
    }

    if (readings.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={colSpan} align='center'>
            <Typography color='text.secondary' py={1}>
              Sin lecturas registradas. Pulsa&nbsp;
              <Typography
                component='span'
                color='primary'
                sx={{ cursor: 'pointer' }}
                onClick={onAdd}
              >
                + añadir lectura
              </Typography>
              &nbsp;para empezar.
            </Typography>
          </TableCell>
        </TableRow>
      )
    }

    return readings.map((reading) => (
      <TableRow
        hover
        key={reading._id}
        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
      >
        {columns.map((col) => (
          <TableCell key={col.id} align={col.align}>
            {col.render(reading)}
          </TableCell>
        ))}
        <TableCell align='right'>
          <Stack direction='row' spacing={0} justifyContent='flex-end'>
            <Tooltip title='Editar lectura'>
              <IconButton size='small' aria-label='editar lectura' onClick={() => onEdit(reading)}>
                <EditOutlined />
              </IconButton>
            </Tooltip>
            <Tooltip title='Eliminar lectura'>
              <IconButton size='small' color='error' aria-label='eliminar lectura' onClick={() => onDelete(reading)}>
                <DeleteOutlined />
              </IconButton>
            </Tooltip>
          </Stack>
        </TableCell>
      </TableRow>
    ))
  }

  return (
    <ScrollableTable
      title='Lecturas'
      stickyHeader
      sx={{
        '& .MuiTableCell-root:first-of-type': { pl: 2 },
        '& .MuiTableCell-root:last-of-type': { pr: 3 }
      }}
    >
      <TableHead>
        <TableRow>
          {columns.map((col) => (
            <TableCell key={col.id} align={col.align}>
              {col.label}
            </TableCell>
          ))}
          <TableCell align='right'>Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {renderBody()}
      </TableBody>
    </ScrollableTable>
  )
}

export default SupplyReadingList
