import React from 'react'
import { Box } from '@mui/material'
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
}

const YieldSettlementChart = ({ yieldData }: Props) => {
  const chartColors = useChartColors()

  // Reverse settlements to show from oldest (left) to newest (right)
  const chartData = [...yieldData.settlements].reverse().map((settlement, index) => {
    const label = `Liq. #${index + 1}`
    const value = yieldData.type === 'interest' ? (settlement.net ?? 0) : (settlement.percentage ?? 0)
    return {
      label,
      value
    }
  })

  if (chartData.length === 0) return null

  const tooltipFormatter = (value: unknown) => {
    if (yieldData.type === 'interest') {
      return format.euro(Number(value))
    }
    return `${format.number(Number(value))}%`
  }

  return (
    <MainCard title='Histórico por Liquidación'>
      <Box sx={{ height: 300, mt: 2 }}>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <XAxis dataKey='label' tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <ChartTooltip formatter={tooltipFormatter} labelFormatter={(label) => `Liquidación: ${label}`} />
            <Bar dataKey='value' radius={[4, 4, 0, 0]} maxBarSize={50}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </MainCard>
  )
}

export default YieldSettlementChart
