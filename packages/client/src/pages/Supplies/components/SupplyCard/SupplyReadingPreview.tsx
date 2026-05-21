import { Box, Divider, List, ListItem, ListItemText, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { SupplyReading } from 'types'
import { format } from 'utils'

type Props = {
  readings: SupplyReading[]
  isElectricity: boolean
  unit: string
}

const getConsumptionLabel = (reading: SupplyReading, isElectricity: boolean, unit: string): string => {
  if (isElectricity) {
    return `P:${reading.consumptionPeak ?? '-'} kWh | L:${reading.consumptionFlat ?? '-'} kWh | V:${reading.consumptionOffPeak ?? '-'} kWh`
  }

  const consumption = reading.consumption ?? '-'
  return `${consumption}${unit ? ` ${unit}` : ''}`
}

const SupplyReadingPreview = ({ readings, isElectricity, unit }: Props) => {
  if (readings.length === 0) return null

  return (
    <>
      <Divider />
      <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, px: 1, py: 0.5, mx: -1 }}>
        <Typography variant='body2' color='textSecondary' sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
          Últimas lecturas
        </Typography>
        <List dense disablePadding>
          {readings.map((reading) => {
            const dateLabel = `${dayjs(reading.startDate).format('DD/MM/YY')} - ${dayjs(reading.endDate).format('DD/MM/YY')}`
            const amountColor = reading.amount < 0 ? 'error.main' : 'text.secondary'
            const amountLabel = Number.isFinite(reading.amount)
              ? format.euro(reading.amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : '-'

            return (
              <ListItem key={reading._id} disablePadding sx={{ py: 0.25 }}>
                <ListItemText
                  primary={
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant='body2' color='textSecondary'>
                          {dateLabel}
                        </Typography>
                        <Typography variant='body2' sx={{ fontWeight: 600 }}>
                          {getConsumptionLabel(reading, isElectricity, unit)}
                        </Typography>
                      </Box>
                      <Typography variant='caption' color={amountColor}>
                        {amountLabel}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            )
          })}
        </List>
      </Box>
    </>
  )
}

export default SupplyReadingPreview
