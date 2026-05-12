import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'

import { useSupplies, useSupply, useSupplyReadings } from 'hooks'
import { SupplyInput } from 'types'
import { SUPPLY_TYPE_UNITS } from '../Supplies/utils/supply'
import SupplyForm from '../Supplies/components/SupplyForm'
import SupplyReadingForm from '../Supplies/components/SupplyReadingForm'
import SupplyReadingList from '../Supplies/components/SupplyReadingList'
import RemoveModal from '../Supplies/components/RemoveModal'
import { SupplyConsumptionChart, SupplyYearStats, SupplyTrendChart } from './components'
import SupplyDetailHeader from './components/SupplyDetailHeader'
import YearSelector from './components/YearSelector'
import { useSupplyDetailModals } from './hooks/useSupplyDetailModals'

const SupplyDetail = () => {
  const { supplyId } = useParams<{ supplyId: string }>()
  const navigate = useNavigate()

  const { isLoading: loadingSupplies, updateSupply } = useSupplies()
  const { supply } = useSupply(supplyId)
  const { readings, isLoading: loadingReadings, createReading, updateReading, removeReading } =
    useSupplyReadings(supplyId ?? null)

  const availableYears = useMemo(
    () => Array.from(new Set(readings.map((reading) => new Date(reading.startDate).getFullYear()))).toSorted((a, b) => b - a),
    [readings]
  )

  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear())

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0])
    }
  }, [availableYears, selectedYear])

  const filteredReadings = useMemo(
    () => readings.filter((reading) => new Date(reading.startDate).getFullYear() === selectedYear),
    [readings, selectedYear]
  )

  const { activeModal, setActiveModal, closeModal, handleReadingSubmit } = useSupplyDetailModals({
    supply: supply ?? null,
    createReading,
    updateReading
  })

  if (loadingSupplies) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: 6
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (!supply) {
    return (
      <Typography
        color='textSecondary'
        sx={{
          mt: 4,
          textAlign: 'center'
        }}
      >Suministro no encontrado.
      </Typography>
    )
  }

  return (
    <Stack spacing={3}>
      <SupplyDetailHeader
        supply={supply}
        onBack={() => navigate('/suministros')}
        onAddReading={() => setActiveModal({ type: 'add' })}
        onEditSupply={() => setActiveModal({ type: 'editSupply' })}
        onCompareTariffs={() => navigate(`/suministros/${supply._id}/comparar`)}
      />

      <YearSelector
        years={availableYears}
        selectedYear={selectedYear}
        readingCount={filteredReadings.length}
        onYearChange={setSelectedYear}
      />

      <SupplyReadingList
        readings={filteredReadings}
        isLoading={loadingReadings}
        isElectricity={supply.type === 'electricity'}
        unit={SUPPLY_TYPE_UNITS[supply.type]}
        onAdd={() => setActiveModal({ type: 'add' })}
        onEdit={(reading) => setActiveModal({ type: 'edit', data: reading })}
        onDelete={(reading) => setActiveModal({ type: 'delete', data: reading })}
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

      <SupplyTrendChart
        readings={readings}
        isElectricity={supply.type === 'electricity'}
        unit={SUPPLY_TYPE_UNITS[supply.type]}
      />

      {(activeModal?.type === 'add' || activeModal?.type === 'edit') && (
        <SupplyReadingForm
          supply={supply}
          reading={activeModal.type === 'edit' ? activeModal.data : undefined}
          onClose={closeModal}
          onSubmit={handleReadingSubmit}
        />
      )}

      {activeModal?.type === 'editSupply' && (
        <SupplyForm
          supply={supply}
          propertyId={supply.propertyId}
          onClose={closeModal}
          onSubmit={(data: SupplyInput) => updateSupply(supply._id, data)}
        />
      )}

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
