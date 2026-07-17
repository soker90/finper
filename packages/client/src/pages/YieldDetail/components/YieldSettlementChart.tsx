import React, { useMemo } from 'react'
import { Box } from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import MainCard from 'components/MainCard'
import { format } from 'utils'
import { YieldDetail } from 'types'
import { useChartColors } from '../../../pages/Dashboard/components/shared'

interface Props {
  yieldData: YieldDetail
  viewMode?: 'settlement' | 'annual'
}

const YieldSettlementChart = ({ yieldData, viewMode = 'settlement' }: Props) => {
  const chartColors = useChartColors()

  let estimatedCashbackRate = 0
  if (yieldData.type === 'cashback') {
    const completedSettlements = yieldData.settlements.filter((s) => s.status === 'completed' && (s.billsTotal ?? 0) > 0 && (s.cashbackAmount ?? 0) > 0)
    if (completedSettlements.length > 0) {
      const totalBills = completedSettlements.reduce((sum, s) => sum + (s.billsTotal ?? 0), 0)
      const totalCashback = completedSettlements.reduce((sum, s) => sum + (s.cashbackAmount ?? 0), 0)
      if (totalBills > 0) {
        estimatedCashbackRate = (totalCashback / totalBills) * 100
      }
    }
  }

  const chartData = useMemo(() => {
    if (viewMode === 'annual') {
      const annualMap = new Map<number, { net: number, billsTotal: number, cashbackAmount: number, validPercentages: number[] }>()
      for (const s of yieldData.settlements) {
        const year = s.settlementDate ? new Date(s.settlementDate).getFullYear() : new Date().getFullYear()
        const current = annualMap.get(year) ?? { net: 0, billsTotal: 0, cashbackAmount: 0, validPercentages: [] }
        current.net += (s.net ?? 0)
        current.billsTotal += (s.billsTotal ?? 0)
        current.cashbackAmount += (s.cashbackAmount ?? 0)
        if ((s.percentage ?? 0) > 0) {
          current.validPercentages.push(s.percentage!)
        }
        annualMap.set(year, current)
      }
      return Array.from(annualMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([year, stats]) => {
          let value = 0
          if (yieldData.type === 'interest') {
            value = stats.net
          } else {
            if (stats.billsTotal > 0 && stats.cashbackAmount > 0) {
              value = (stats.cashbackAmount / stats.billsTotal) * 100
            } else if (stats.validPercentages.length > 0) {
              value = stats.validPercentages.reduce((a, b) => a + b, 0) / stats.validPercentages.length
            } else {
              value = 0
            }
          }
          return {
            label: String(year),
            value: Number(value.toFixed(2)),
            isPending: false,
            estimatedAmount: yieldData.type === 'cashback' ? stats.cashbackAmount : null
          }
        })
    }

    return [...yieldData.settlements].reverse().map((settlement, index) => {
      const isPending = settlement.status === 'pending' || !settlement.settlementDate
      const label = !isPending
        ? (format.monthYear(settlement.settlementDate!) ?? `Liq. #${index + 1}`)
        : 'Pendiente'

      let value = 0
      let estimatedAmount: number | null = null

      if (yieldData.type === 'interest') {
        value = settlement.net ?? 0
        if (isPending && value === 0) {
          const lastCompleted = yieldData.settlements.find((s) => s.status === 'completed' && (s.tae || ((s.net ?? 0) > 0 && (s.averageBalance ?? 0) > 0)))
          if (lastCompleted) {
            let monthlyRate = 0
            if (lastCompleted.tae) {
              monthlyRate = Math.pow(1 + lastCompleted.tae / 100, 1 / 12) - 1
            } else if ((lastCompleted.averageBalance ?? 0) > 0) {
              monthlyRate = (lastCompleted.net ?? 0) / lastCompleted.averageBalance!
            }
            if (monthlyRate > 0 && (settlement.averageBalance ?? 0) > 0) {
              value = settlement.averageBalance! * monthlyRate
              estimatedAmount = value
            }
          }
        }
      } else {
        value = settlement.percentage ?? 0
        if (isPending && value === 0 && (settlement.billsTotal ?? 0) > 0 && estimatedCashbackRate > 0) {
          value = Number(estimatedCashbackRate.toFixed(2))
          estimatedAmount = (settlement.billsTotal ?? 0) * (estimatedCashbackRate / 100)
        }
      }

      return {
        label,
        value,
        isPending,
        estimatedAmount
      }
    })
  }, [yieldData, viewMode, estimatedCashbackRate])

  if (chartData.length === 0) return null

  const tooltipFormatter = (value: unknown, _name: unknown, props: any) => {
    const isPending = props?.payload?.isPending
    const estAmount = props?.payload?.estimatedAmount

    if (viewMode === 'annual') {
      if (yieldData.type === 'interest') {
        return format.euro(Number(value))
      }
      return `${format.number(Number(value))}% (Total: ${format.euro(estAmount ?? 0)})`
    }

    if (yieldData.type === 'interest') {
      const formatted = format.euro(Number(value))
      return isPending && estAmount !== null ? `${formatted} (Estimado)` : formatted
    }
    const formatted = `${format.number(Number(value))}%`
    return isPending && estAmount !== null
      ? `${formatted} (Est. ${format.euro(estAmount)})`
      : formatted
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
