import { useMemo } from 'react'
import { Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import dayjs from 'dayjs'

import { MainCard } from 'components'
import { SupplyReading } from 'types'

type Props = {
  readings: SupplyReading[]
  isElectricity: boolean
  unit: string
}

const SupplyConsumptionChart = ({ readings, isElectricity, unit }: Props) => {
  const theme = useTheme()

  const data = useMemo(() => {
    return readings
      .toSorted((a, b) => a.startDate - b.startDate)
      .map((reading) => ({
        label: dayjs(reading.startDate).format('MM/YY'),
        consumption: reading.consumption ?? 0,
        peak: reading.consumptionPeak ?? 0,
        flat: reading.consumptionFlat ?? 0,
        offPeak: reading.consumptionOffPeak ?? 0
      }))
  }, [readings])

  if (data.length === 0) return null

  return (
    <MainCard title='Grafica de consumo'>
      <ResponsiveContainer width='100%' height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray='3 3' stroke={theme.palette.divider} />
          <XAxis dataKey='label' tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value}${unit ? ` ${unit}` : ''}`}
          />
          <Tooltip />
          <Legend
            wrapperStyle={{ fontSize: 14 }}
            formatter={(value) => (
              <Typography component='span' variant='body2'>{value}</Typography>
            )}
          />

          {isElectricity
            ? (
              <>
                <Bar dataKey='peak' name='Punta' stackId='consumption' fill={theme.palette.warning.main} radius={[4, 4, 0, 0]} />
                <Bar dataKey='flat' name='Llano' stackId='consumption' fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                <Bar dataKey='offPeak' name='Valle' stackId='consumption' fill={theme.palette.success.main} radius={[4, 4, 0, 0]} />
              </>
              )
            : <Bar dataKey='consumption' name={`Consumo${unit ? ` (${unit})` : ''}`} fill={theme.palette.info.main} radius={[4, 4, 0, 0]} />}
        </BarChart>
      </ResponsiveContainer>
    </MainCard>
  )
}

export default SupplyConsumptionChart
