import {
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { SupplyReading } from 'types'

interface Props {
  readings: SupplyReading[]
  isLoading: boolean
  isElectricity: boolean
  onAdd: () => void
  onEdit: (reading: SupplyReading) => void
  onDelete: (reading: SupplyReading) => void
}

const SupplyReadingList = ({ readings, isLoading, isElectricity, onAdd, onEdit, onDelete }: Props) => {
  if (isLoading) {
    return (
      <Typography color='text.secondary' textAlign='center'>
        Cargando lecturas…
      </Typography>
    )
  }

  if (readings.length === 0) {
    return (
      <Typography color='text.secondary' textAlign='center' py={2}>
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
    )
  }

  return (
    <Table size='small'>
      <TableHead>
        <TableRow>
          <TableCell>Inicio</TableCell>
          <TableCell>Fin</TableCell>
          {isElectricity
            ? (
              <>
                <TableCell>Punta (kWh)</TableCell>
                <TableCell>Llano (kWh)</TableCell>
                <TableCell>Valle (kWh)</TableCell>
              </>
              )
            : <TableCell>Consumo</TableCell>}
          <TableCell align='right'>Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {readings.map((reading) => (
          <TableRow key={reading._id}>
            <TableCell>{dayjs(reading.startDate).format('DD/MM/YYYY')}</TableCell>
            <TableCell>{dayjs(reading.endDate).format('DD/MM/YYYY')}</TableCell>
            {isElectricity
              ? (
                <>
                  <TableCell>{reading.consumptionPeak ?? '—'}</TableCell>
                  <TableCell>{reading.consumptionFlat ?? '—'}</TableCell>
                  <TableCell>{reading.consumptionOffPeak ?? '—'}</TableCell>
                </>
                )
              : <TableCell>{reading.consumption ?? '—'}</TableCell>}
            <TableCell align='right'>
              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                <Tooltip title='Editar lectura'>
                  <IconButton
                    size='small'
                    aria-label='editar lectura'
                    onClick={() => onEdit(reading)}
                  >
                    <EditOutlined />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Eliminar lectura'>
                  <IconButton
                    size='small'
                    color='error'
                    aria-label='eliminar lectura'
                    onClick={() => onDelete(reading)}
                  >
                    <DeleteOutlined />
                  </IconButton>
                </Tooltip>
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default SupplyReadingList
