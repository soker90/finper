import { Grid, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { MainCard } from 'components'
import { SupplyReading } from 'types'
import { format } from 'utils'

type Props = {
  readings: SupplyReading[]
  isElectricity: boolean
  unit: string
}

const getConsumption = (reading: SupplyReading, isElectricity: boolean): number => {
  if (isElectricity) {
    return (reading.consumptionPeak ?? 0) + (reading.consumptionFlat ?? 0) + (reading.consumptionOffPeak ?? 0)
  }
  return reading.consumption ?? 0
}

const SupplyYearStats = ({ readings, isElectricity, unit }: Props) => {
  if (readings.length === 0) return null

  const normalizeAmount = (reading: SupplyReading): number => (Number.isFinite(reading.amount) ? reading.amount : 0)

  const totalAmount = readings.reduce((sum, reading) => sum + normalizeAmount(reading), 0)
  const totalConsumption = readings.reduce((sum, reading) => sum + getConsumption(reading, isElectricity), 0)
  const averageAmount = totalAmount / readings.length

  const topReading = readings.reduce((max, reading) => {
    return getConsumption(reading, isElectricity) > getConsumption(max, isElectricity) ? reading : max
  }, readings[0])

  return (
    <MainCard title='Resumen anual'>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Typography variant='caption' color='text.secondary'>Coste total</Typography>
          <Typography variant='h5' color={totalAmount < 0 ? 'error.main' : 'text.primary'}>
            {format.euro(totalAmount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Typography variant='caption' color='text.secondary'>Consumo total</Typography>
          <Typography variant='h5'>
            {format.number(totalConsumption, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            {unit ? ` ${unit}` : ''}
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Typography variant='caption' color='text.secondary'>Media por lectura</Typography>
          <Typography variant='h5' color={averageAmount < 0 ? 'error.main' : 'text.primary'}>
            {format.euro(averageAmount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Typography variant='caption' color='text.secondary'>Periodo de mayor consumo</Typography>
          <Typography variant='body1' sx={{ fontWeight: 600 }}>
            {dayjs(topReading.startDate).format('DD/MM/YYYY')} - {dayjs(topReading.endDate).format('DD/MM/YYYY')}
          </Typography>
        </Grid>
      </Grid>
    </MainCard>
  )
}

export default SupplyYearStats
