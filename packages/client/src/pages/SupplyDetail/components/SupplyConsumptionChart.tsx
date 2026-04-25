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
import { getElectricityColors, ELECTRICITY_LABELS, CHART_GRID_PROPS, CHART_AXIS_PROPS } from './chartConfig'

type Props = {
  readings: SupplyReading[]
  isElectricity: boolean
  unit: string
}

const SupplyConsumptionChart = ({ readings, isElectricity, unit }: Props) => {
  const theme = useTheme()
  const colors = getElectricityColors(theme)

  const data = useMemo(() =>
    readings
      .toReversed()
      .map((reading) => ({
        label: dayjs(reading.startDate).format('MM/YY'),
        consumption: reading.consumption ?? 0,
        peak: reading.consumptionPeak ?? 0,
        flat: reading.consumptionFlat ?? 0,
        offPeak: reading.consumptionOffPeak ?? 0
      }))
  , [readings])

  if (data.length === 0) return null

  const unitSuffix = unit ? ` ${unit}` : ''

  return (
    <MainCard title='Gráfica de consumo'>
      <ResponsiveContainer width='100%' height={280}>
        <BarChart data={data}>
          <CartesianGrid {...CHART_GRID_PROPS} stroke={theme.palette.divider} />
          <XAxis dataKey='label' {...CHART_AXIS_PROPS} />
          <YAxis {...CHART_AXIS_PROPS} tickFormatter={(v) => `${v}${unitSuffix}`} />
          <Tooltip formatter={(value, name) => [`${value}${unitSuffix}`, name]} />
          <Legend
            wrapperStyle={{ fontSize: 14 }}
            formatter={(value) => (
              <Typography component='span' variant='body2'>{value}</Typography>
            )}
          />
          {isElectricity
            ? (
              <>
                <Bar dataKey='peak' name={ELECTRICITY_LABELS.peak} stackId='consumption' fill={colors.peak} radius={[4, 4, 0, 0]} />
                <Bar dataKey='flat' name={ELECTRICITY_LABELS.flat} stackId='consumption' fill={colors.flat} radius={[4, 4, 0, 0]} />
                <Bar dataKey='offPeak' name={ELECTRICITY_LABELS.offPeak} stackId='consumption' fill={colors.offPeak} radius={[4, 4, 0, 0]} />
              </>
              )
            : <Bar dataKey='consumption' name={`Consumo${unitSuffix}`} fill={theme.palette.info.main} radius={[4, 4, 0, 0]} />}
        </BarChart>
      </ResponsiveContainer>
    </MainCard>
  )
}

export default SupplyConsumptionChart
