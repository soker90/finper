import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Typography
} from '@mui/material'
import { ArrowLeftOutlined, PlusOutlined, ThunderboltOutlined, EditOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import { useSupplies, useSupply, useSupplyReadings } from 'hooks'
import { SupplyReading, SupplyReadingInput, SupplyInput } from 'types'
import { SUPPLY_TYPE_LABELS, SUPPLY_TYPE_COLORS, SUPPLY_TYPE_UNITS, supplyDisplayName } from '../Supplies/utils/supply'
import SupplyForm from '../Supplies/components/SupplyForm'
import SupplyReadingForm from '../Supplies/components/SupplyReadingForm'
import SupplyReadingList from '../Supplies/components/SupplyReadingList'
import RemoveModal from '../Supplies/components/RemoveModal'
import { SupplyConsumptionChart, SupplyYearStats } from './components'

type ModalState =
  | { type: 'add' }
  | { type: 'edit'; data: SupplyReading }
  | { type: 'delete'; data: SupplyReading }
  | { type: 'editSupply' }

const SupplyDetail = () => {
  const { supplyId } = useParams<{ supplyId: string }>()
  const navigate = useNavigate()

  const { isLoading: loadingSupplies, updateSupply } = useSupplies()
  const { supply } = useSupply(supplyId)

  const { readings, isLoading: loadingReadings, createReading, updateReading, removeReading } =
    useSupplyReadings(supplyId ?? null)

  const availableYears = useMemo(() => {
    const years = new Set(readings.map((r) => new Date(r.startDate).getFullYear()))
    return [...years].toSorted((a, b) => b - a)
  }, [readings])

  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear())

  // Sincronizar el año seleccionado con el más reciente disponible
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0])
    }
  }, [availableYears, selectedYear])

  const [activeModal, setActiveModal] = useState<ModalState | null>(null)
  const closeModal = () => setActiveModal(null)

  const filteredReadings = useMemo(
    () => readings.filter((r) => new Date(r.startDate).getFullYear() === selectedYear),
    [readings, selectedYear]
  )

  const handleFormSubmit = (data: Omit<SupplyReadingInput, 'supplyId'>) => {
    const payload: SupplyReadingInput = { ...data, supplyId: supply!._id }

    return activeModal?.type === 'edit'
      ? updateReading(activeModal.data._id, payload)
      : createReading(payload)
  }

  const handleSupplySubmit = (data: SupplyInput) => updateSupply(supply!._id, data)

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
          <IconButton size='small' onClick={() => setActiveModal({ type: 'editSupply' })}>
            <EditOutlined style={{ fontSize: '18px' }} />
          </IconButton>
        </Box>

        <Stack direction='row' spacing={1}>
          {supply.type === 'electricity' && (
            <Button
              variant='outlined'
              startIcon={<ThunderboltOutlined />}
              onClick={() => navigate(`/suministros/${supply._id}/comparar`)}
            >
              Comparar tarifas
            </Button>
          )}
          <Button
            variant='outlined'
            startIcon={<PlusOutlined />}
            onClick={() => setActiveModal({ type: 'add' })}
          >
            Añadir lectura
          </Button>
        </Stack>
      </Box>

      {/* Selector de año */}
      {availableYears.length > 0 && (
        <Box display='flex' alignItems='center' gap={2}>
          <Typography color='textSecondary'>
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
          <Typography color='textSecondary'>
            {filteredReadings.length} lectura{filteredReadings.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      )}

      {/* Tabla de lecturas filtrada */}
      <SupplyReadingList
        readings={filteredReadings}
        isLoading={loadingReadings}
        isElectricity={supply.type === 'electricity'}
        unit={SUPPLY_TYPE_UNITS[supply.type]}
        onAdd={() => setActiveModal({ type: 'add' })}
        onEdit={(r) => setActiveModal({ type: 'edit', data: r })}
        onDelete={(r) => setActiveModal({ type: 'delete', data: r })}
      />

      <SupplyConsumptionChart
        readings={filteredReadings}
        isElectricity={supply.type === 'electricity'}
        unit={SUPPLY_TYPE_UNITS[supply.type]}
      />

      <SupplyYearStats
        readings={filteredReadings}
        isElectricity={supply.type === 'electricity'}
        unit={SUPPLY_TYPE_UNITS[supply.type]}
      />

      {/* Formulario add/edit reading */}
      {(activeModal?.type === 'add' || activeModal?.type === 'edit') && (
        <SupplyReadingForm
          supply={supply}
          reading={activeModal.type === 'edit' ? activeModal.data : undefined}
          onClose={closeModal}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Formulario edit supply */}
      {activeModal?.type === 'editSupply' && (
        <SupplyForm
          supply={supply}
          propertyId={supply.propertyId}
          onClose={closeModal}
          onSubmit={handleSupplySubmit}
        />
      )}

      {/* Confirmación borrado */}
      {activeModal?.type === 'delete' && (
        <RemoveModal
          title='¿Eliminar lectura?'
          description={`¿Eliminar la lectura del ${dayjs(activeModal.data.startDate).format('DD/MM/YYYY')} al ${dayjs(activeModal.data.endDate).format('DD/MM/YYYY')}?`}
          onClose={closeModal}
          onConfirm={() => removeReading(activeModal.data._id)}
        />
      )}
    </Stack>
  )
}

export default SupplyDetail
