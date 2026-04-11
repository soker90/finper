import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Select,
  Stack,
  Typography
} from '@mui/material'
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import { useSupplies, useSupplyReadings } from 'hooks'
import { SupplyReading, SupplyReadingInput } from 'types'
import { SUPPLY_TYPE_LABELS, supplyDisplayName } from '../utils/supply'
import SupplyReadingForm from '../components/SupplyReadingForm'
import SupplyReadingList from '../components/SupplyReadingList'
import RemoveModal from '../components/RemoveModal'

const SUPPLY_TYPE_COLORS: Record<string, 'warning' | 'info' | 'error' | 'primary' | 'default'> = {
  electricity: 'warning',
  water: 'info',
  gas: 'error',
  internet: 'primary',
  other: 'default'
}

const SupplyDetail = () => {
  const { supplyId } = useParams<{ supplyId: string }>()
  const navigate = useNavigate()

  const { properties, isLoading: loadingSupplies } = useSupplies()
  const supply = useMemo(() => {
    for (const prop of properties) {
      const found = prop.supplies.find((s) => s._id === supplyId)
      if (found) return found
    }
    return null
  }, [properties, supplyId])

  const { readings, isLoading: loadingReadings, createReading, updateReading, removeReading } =
    useSupplyReadings(supplyId ?? null)

  const availableYears = useMemo(() => {
    const years = new Set(readings.map((r) => new Date(r.startDate).getFullYear()))
    years.add(new Date().getFullYear())
    return [...years].sort((a, b) => b - a)
  }, [readings])

  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear())
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<SupplyReading | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SupplyReading | null>(null)

  const filteredReadings = useMemo(
    () => readings.filter((r) => new Date(r.startDate).getFullYear() === selectedYear),
    [readings, selectedYear]
  )

  const handleFormSubmit = (data: Omit<SupplyReadingInput, 'supplyId'>) => {
    const payload: SupplyReadingInput = { ...data, supplyId: supply!._id }
    return editTarget
      ? updateReading(editTarget._id, payload)
      : createReading(payload)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditTarget(null)
  }

  if (loadingSupplies) {
    return (
      <Box display='flex' justifyContent='center' mt={6}>
        <CircularProgress />
      </Box>
    )
  }

  if (!supply) {
    return (
      <Typography color='textSecondary' mt={4} textAlign='center'>
        Suministro no encontrado.
      </Typography>
    )
  }

  return (
    <Stack spacing={3}>
      {/* Cabecera */}
      <Box display='flex' alignItems='center' justifyContent='space-between' flexWrap='wrap' gap={1}>
        <Box display='flex' alignItems='center' gap={1}>
          <Button
            startIcon={<ArrowLeftOutlined />}
            onClick={() => navigate('/suministros')}
            size='small'
          >
            Volver
          </Button>
          <Typography variant='h4'>{supplyDisplayName(supply)}</Typography>
          <Chip
            label={SUPPLY_TYPE_LABELS[supply.type]}
            color={SUPPLY_TYPE_COLORS[supply.type] ?? 'default'}
            size='small'
          />
        </Box>

        <Button
          variant='contained'
          startIcon={<PlusOutlined />}
          onClick={() => setShowForm(true)}
        >
          Añadir lectura
        </Button>
      </Box>

      {/* Selector de año */}
      <Box display='flex' alignItems='center' gap={2}>
        <Typography variant='body2' color='textSecondary'>
          Año:
        </Typography>
        <Select
          size='small'
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {availableYears.map((y) => (
            <MenuItem key={y} value={y}>
              {y}
            </MenuItem>
          ))}
        </Select>
        <Typography variant='caption' color='textSecondary'>
          {filteredReadings.length} lectura{filteredReadings.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Tabla de lecturas filtrada */}
      <SupplyReadingList
        readings={filteredReadings}
        isLoading={loadingReadings}
        isElectricity={supply.type === 'electricity'}
        onAdd={() => setShowForm(true)}
        onEdit={(r) => setEditTarget(r)}
        onDelete={(r) => setDeleteTarget(r)}
      />

      {/* Formulario add/edit */}
      {(showForm || Boolean(editTarget)) && (
        <SupplyReadingForm
          supply={supply}
          reading={editTarget ?? undefined}
          onClose={handleCloseForm}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Confirmación borrado */}
      {deleteTarget && (
        <RemoveModal
          title='¿Eliminar lectura?'
          description={`¿Eliminar la lectura del ${dayjs(deleteTarget.startDate).format('DD/MM/YYYY')} al ${dayjs(deleteTarget.endDate).format('DD/MM/YYYY')}?`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => removeReading(deleteTarget._id)}
        />
      )}
    </Stack>
  )
}

export default SupplyDetail
