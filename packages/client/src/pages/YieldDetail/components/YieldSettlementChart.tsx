import React from 'react'
import { Box } from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import MainCard from 'components/MainCard'
import { format } from 'utils'
import { YieldDetail, YieldSettlement, YieldType } from 'types'
import { useChartColors } from '../../../pages/Dashboard/components/shared'
import { getSettlementYear } from '../utils'

interface Props {
  yieldData: YieldDetail
  viewMode?: 'settlement' | 'annual'
}

interface ChartPoint {
  label: string
  value: number
  isPending: boolean
  estimatedAmount: number | null
}

interface AnnualStats {
  net: number
  billsTotal: number
  cashbackAmount: number
  validPercentages: number[]
}

const getAnnualValue = (type: YieldType, stats: AnnualStats): number => {
  if (type === 'interest') return stats.net
  if (stats.billsTotal > 0 && stats.cashbackAmount > 0) return (stats.cashbackAmount / stats.billsTotal) * 100
  if (stats.validPercentages.length > 0) return stats.validPercentages.reduce((a, b) => a + b, 0) / stats.validPercentages.length
  return 0
}

const buildAnnualChartData = (yieldData: YieldDetail): ChartPoint[] => {
  const annualMap = new Map<number, AnnualStats>()
  for (const settlement of yieldData.settlements) {
    // Pending settlements (no settlementDate yet) don't belong to a closed
    // year: skip them instead of bucketing under the current calendar year.
    const year = getSettlementYear(settlement)
    if (year === null) continue
    const current = annualMap.get(year) ?? { net: 0, billsTotal: 0, cashbackAmount: 0, validPercentages: [] }
    current.net += (settlement.net ?? 0)
    current.billsTotal += (settlement.billsTotal ?? 0)
    current.cashbackAmount += (settlement.cashbackAmount ?? 0)
    if ((settlement.percentage ?? 0) > 0) {
      current.validPercentages.push(settlement.percentage!)
    }
    annualMap.set(year, current)
  }

  return Array.from(annualMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([year, stats]) => ({
      label: String(year),
      value: Number(getAnnualValue(yieldData.type, stats).toFixed(2)),
      isPending: false,
      estimatedAmount: yieldData.type === 'cashback' ? stats.cashbackAmount : null
    }))
}

const getInterestSettlementPoint = (settlement: YieldSettlement, isPending: boolean, allSettlements: YieldSettlement[]): { value: number, estimatedAmount: number | null } => {
  const value = settlement.net ?? 0
  if (!(isPending && value === 0)) return { value, estimatedAmount: null }

  const lastCompleted = allSettlements.find((s) => s.status === 'completed' && (s.tae || ((s.net ?? 0) > 0 && (s.averageBalance ?? 0) > 0)))
  if (!lastCompleted) return { value, estimatedAmount: null }

  const monthlyRate = lastCompleted.tae
    ? Math.pow(1 + lastCompleted.tae / 100, 1 / 12) - 1
    : (lastCompleted.averageBalance ?? 0) > 0 ? (lastCompleted.net ?? 0) / lastCompleted.averageBalance! : 0

  if (monthlyRate > 0 && (settlement.averageBalance ?? 0) > 0) {
    const estimatedValue = settlement.averageBalance! * monthlyRate
    return { value: estimatedValue, estimatedAmount: estimatedValue }
  }
  return { value, estimatedAmount: null }
}

const getCashbackSettlementPoint = (settlement: YieldSettlement, isPending: boolean, estimatedCashbackRate: number): { value: number, estimatedAmount: number | null } => {
  const value = settlement.percentage ?? 0
  if (isPending && value === 0 && (settlement.billsTotal ?? 0) > 0 && estimatedCashbackRate > 0) {
    return {
      value: Number(estimatedCashbackRate.toFixed(2)),
      estimatedAmount: (settlement.billsTotal ?? 0) * (estimatedCashbackRate / 100)
    }
  }
  return { value, estimatedAmount: null }
}

const buildSettlementChartData = (yieldData: YieldDetail, estimatedCashbackRate: number): ChartPoint[] =>
  [...yieldData.settlements].reverse().map((settlement, index) => {
    const isPending = settlement.status === 'pending' || !settlement.settlementDate
    const label = !isPending
      ? (format.monthYear(settlement.settlementDate!) ?? `Liq. #${index + 1}`)
      : 'Pendiente'

    const { value, estimatedAmount } = yieldData.type === 'interest'
      ? getInterestSettlementPoint(settlement, isPending, yieldData.settlements)
      : getCashbackSettlementPoint(settlement, isPending, estimatedCashbackRate)

    return { label, value, isPending, estimatedAmount }
  })

const getEstimatedCashbackRate = (settlements: YieldSettlement[]): number => {
  const completedSettlements = settlements.filter((s) => s.status === 'completed' && (s.billsTotal ?? 0) > 0 && (s.cashbackAmount ?? 0) > 0)
  if (completedSettlements.length === 0) return 0

  const totalBills = completedSettlements.reduce((sum, s) => sum + (s.billsTotal ?? 0), 0)
  const totalCashback = completedSettlements.reduce((sum, s) => sum + (s.cashbackAmount ?? 0), 0)
  return totalBills > 0 ? (totalCashback / totalBills) * 100 : 0
}

const formatAnnualTooltip = (type: YieldType, value: number, estimatedAmount: number | null): string =>
  type === 'interest'
    ? format.euro(value)
    : `${format.number(value)}% (Total: ${format.euro(estimatedAmount ?? 0)})`

const formatSettlementTooltip = (type: YieldType, value: number, isPending: boolean, estimatedAmount: number | null): string => {
  if (type === 'interest') {
    const formatted = format.euro(value)
    return isPending && estimatedAmount !== null ? `${formatted} (Estimado)` : formatted
  }
  const formatted = `${format.number(value)}%`
  return isPending && estimatedAmount !== null
    ? `${formatted} (Est. ${format.euro(estimatedAmount)})`
    : formatted
}

const YieldSettlementChart = ({ yieldData, viewMode = 'settlement' }: Props) => {
  const chartColors = useChartColors()

  const estimatedCashbackRate = yieldData.type === 'cashback' ? getEstimatedCashbackRate(yieldData.settlements) : 0

  const chartData = viewMode === 'annual'
    ? buildAnnualChartData(yieldData)
    : buildSettlementChartData(yieldData, estimatedCashbackRate)

  if (chartData.length === 0) return null

  const tooltipFormatter = (value: unknown, _name: unknown, props: { payload?: { isPending?: boolean, estimatedAmount?: number | null } }) => {
    const isPending = Boolean(props?.payload?.isPending)
    const estAmount = props?.payload?.estimatedAmount ?? null

    return viewMode === 'annual'
      ? formatAnnualTooltip(yieldData.type, Number(value), estAmount)
      : formatSettlementTooltip(yieldData.type, Number(value), isPending, estAmount)
  }

  return (
    <MainCard title={viewMode === 'annual' ? 'Histórico Anual' : 'Histórico por Liquidación'}>
      <Box sx={{ height: 300, mt: 2 }}>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <XAxis dataKey='label' tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <ChartTooltip formatter={tooltipFormatter} labelFormatter={(label) => viewMode === 'annual' ? `Año: ${label}` : `Liquidación: ${label}`} />
            <Bar dataKey='value' radius={[4, 4, 0, 0]} maxBarSize={50}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.isPending ? alpha(chartColors[index % chartColors.length], 0.35) : chartColors[index % chartColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </MainCard>
  )
}

export default YieldSettlementChart
