import { useMemo } from 'react'
import { Typography } from '@mui/material'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import ScrollableTable, { Action } from 'components/ScrollableTable'
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

  const actions: Action<SupplyReading>[] = useMemo(() => [
    { icon: EditOutlined, tooltip: 'Editar lectura', onClick: onEdit },
    { icon: DeleteOutlined, tooltip: 'Eliminar lectura', onClick: onDelete, color: 'error' }
  ], [onEdit, onDelete])

  const emptyNode = (
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
  )

  return (
    <ScrollableTable
      title='Lecturas'
      stickyHeader
      sx={{
        '& .MuiTableCell-root:first-of-type': { pl: 2 },
        '& .MuiTableCell-root:last-of-type': { pr: 3 }
      }}
      columns={columns}
      data={isLoading ? [] : readings}
      actions={actions}
      keyExtractor={(r) => r._id}
      emptyNode={isLoading
        ? <Typography color='text.secondary'>Cargando lecturas…</Typography>
        : emptyNode}
    />
  )
}

export default SupplyReadingList
