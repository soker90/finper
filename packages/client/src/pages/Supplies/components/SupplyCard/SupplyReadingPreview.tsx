import { Box, Divider, List, ListItem, ListItemText, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { SupplyReading } from 'types'

type Props = {
  readings: SupplyReading[]
  isElectricity: boolean
  unit: string
}

const SupplyReadingPreview = ({ readings, isElectricity, unit }: Props) => {
  if (readings.length === 0) return null

  return (
    <>
      <Divider />
      <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, px: 1, py: 0.5, mx: -1 }}>
        <Typography variant='body2' color='textSecondary' fontWeight={600} display='block' mb={0.5}>
          Últimas lecturas
        </Typography>
        <List dense disablePadding>
          {readings.map((r) => (
            <ListItem key={r._id} disablePadding sx={{ py: 0.25 }}>
              <ListItemText
                primary={
                  <Box display='flex' justifyContent='space-between' alignItems='center'>
                    <Typography variant='body2' color='textSecondary'>
                      {dayjs(r.startDate).format('DD/MM/YY')} – {dayjs(r.endDate).format('DD/MM/YY')}
                    </Typography>
                    <Typography variant='body2' fontWeight={600}>
                      {isElectricity
                        ? `P:${r.consumptionPeak ?? '—'} kWh · L:${r.consumptionFlat ?? '—'} kWh · V:${r.consumptionOffPeak ?? '—'} kWh`
                        : `${r.consumption ?? '—'}${unit ? ` ${unit}` : ''}`}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </>
  )
}

export default SupplyReadingPreview
