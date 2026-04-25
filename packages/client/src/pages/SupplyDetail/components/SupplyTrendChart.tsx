import { useState, useMemo, useCallback } from 'react'
import { Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { LegendPayload } from 'recharts'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import dayjs from 'dayjs'

import { MainCard } from 'components'
import { SupplyReading } from 'types'
import { getElectricityColors, ELECTRICITY_LABELS, CHART_GRID_PROPS, CHART_AXIS_PROPS } from './chartConfig'

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000

type Props = {
  readings: SupplyReading[]
  isElectricity: boolean
  unit: string
}

const ELEC_KEYS = ['peak', 'flat', 'offPeak'] as const
type ElecKey = typeof ELEC_KEYS[number]

const isElecKey = (key: unknown): key is ElecKey =>
  ELEC_KEYS.includes(key as ElecKey)

const DEFAULT_OPACITY: Record<ElecKey, number> = { peak: 1, flat: 1, offPeak: 1 }
const DIM_OPACITY: Record<ElecKey, number> = { peak: 0.2, flat: 0.2, offPeak: 0.2 }

const SupplyTrendChart = ({ readings, isElectricity, unit }: Props) => {
  const theme = useTheme()
  const colors = getElectricityColors(theme)
  const [opacity, setOpacity] = useState<Record<ElecKey, number>>(DEFAULT_OPACITY)

  const data = useMemo(() => {
    if (!readings.length) return []
    const windowMs = isElectricity ? ONE_YEAR_MS : ONE_YEAR_MS * 2
    const cutoff = readings[0].endDate - windowMs
    return readings
      .filter((r) => r.endDate >= cutoff)
      .toReversed()
      .map((r) => ({
        label: dayjs(r.endDate).format('MM/YY'),
        peak: r.consumptionPeak ?? 0,
        flat: r.consumptionFlat ?? 0,
        offPeak: r.consumptionOffPeak ?? 0,
        consumption: r.consumption ?? 0
      }))
  }, [readings, isElectricity])

  const handleLegendMouseEnter = useCallback((o: LegendPayload) => {
    if (!isElecKey(o.dataKey)) return
    setOpacity({ ...DIM_OPACITY, [o.dataKey]: 1 })
  }, [])

  const handleLegendMouseLeave = useCallback(() => setOpacity(DEFAULT_OPACITY), [])

  if (data.length === 0) return null

  const title = isElectricity ? 'Tendencia del Último Año' : 'Tendencia de los Últimos 2 Años'
  const unitSuffix = unit ? ` ${unit}` : ''

  return (
    <MainCard title={title}>
      <ResponsiveContainer width='100%' height={260}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid {...CHART_GRID_PROPS} stroke={theme.palette.divider} />
          <XAxis dataKey='label' {...CHART_AXIS_PROPS} />
          <YAxis {...CHART_AXIS_PROPS} tickFormatter={(v) => `${v}${unitSuffix}`} />
          <Tooltip
            formatter={(value, name) => [`${value}${unitSuffix}`, name]}
            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: theme.shadows[3] }}
          />
          {isElectricity
            ? (
              <>
                <Legend
                  iconType='circle'
                  wrapperStyle={{ fontSize: 13, cursor: 'pointer' }}
                  onMouseEnter={handleLegendMouseEnter}
                  onMouseLeave={handleLegendMouseLeave}
                  formatter={(value) => (
                    <Typography component='span' variant='body2'>{value}</Typography>
                  )}
                />
                {ELEC_KEYS.map((key) => (
                  <Line
                    key={key}
                    type='monotone'
                    dataKey={key}
                    name={ELECTRICITY_LABELS[key]}
                    stroke={colors[key]}
                    strokeWidth={2}
                    strokeOpacity={opacity[key]}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </>
              )
            : (
              <Line
                type='monotone'
                dataKey='consumption'
                name='Consumo'
                stroke={theme.palette.info.main}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />
              )}
        </LineChart>
      </ResponsiveContainer>
    </MainCard>
  )
}

export default SupplyTrendChart
