import {
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { MainCard } from 'components'
import { SupplyReading } from 'types'

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
  const renderBody = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={isElectricity ? 7 : 4} align='center'>
            <Typography color='text.secondary'>Cargando lecturas…</Typography>
          </TableCell>
        </TableRow>
      )
    }

    if (readings.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={isElectricity ? 7 : 4} align='center'>
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
        <TableCell>{dayjs(reading.startDate).format('DD/MM/YYYY')}</TableCell>
        <TableCell>{dayjs(reading.endDate).format('DD/MM/YYYY')}</TableCell>
        {isElectricity
          ? (
            <>
              <TableCell align='right'>{reading.consumptionPeak ?? '—'}</TableCell>
              <TableCell align='right'>{reading.consumptionFlat ?? '—'}</TableCell>
              <TableCell align='right'>{reading.consumptionOffPeak ?? '—'}</TableCell>
            </>
            )
          : <TableCell align='right'>{reading.consumption ?? '—'}</TableCell>}
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
    <MainCard title='Lecturas' content={false}>
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
          size='small'
          stickyHeader
          aria-labelledby='supply-readings-table'
          sx={{
            '& .MuiTableCell-root:first-child': { pl: 2 },
            '& .MuiTableCell-root:last-child': { pr: 3 }
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>Inicio</TableCell>
              <TableCell>Fin</TableCell>
              {isElectricity
                ? (
                  <>
                    <TableCell align='right'>Punta (kWh)</TableCell>
                    <TableCell align='right'>Llano (kWh)</TableCell>
                    <TableCell align='right'>Valle (kWh)</TableCell>
                  </>
                  )
                : <TableCell align='right'>Consumo{unit ? ` (${unit})` : ''}</TableCell>}
              <TableCell align='right'>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {renderBody()}
          </TableBody>
        </Table>
      </TableContainer>
    </MainCard>
  )
}

export default SupplyReadingList
