import { useNavigate } from 'react-router'
import { Box } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TagYearSummary } from 'types'
import { format } from 'utils'
import { useChartColors } from '../../../Dashboard/components/shared'

interface HistoricBarChartProps {
  tagName: string
  years: TagYearSummary[]
  height?: number
  compact?: boolean
}

const tooltipFormatter = (value: unknown) => format.euro(Number(value))

const HistoricBarChart = ({ tagName, years, height = 280, compact = false }: HistoricBarChartProps) => {
  const navigate = useNavigate()
  const chartColors = useChartColors()

  const handleBarChartClick = (data: { activeLabel?: string | number } | null) => {
    if (data?.activeLabel) {
      navigate(`/seguimientos/${tagName}/${data.activeLabel}`)
    }
  }

  return (
    <Box sx={{
      height
    }}
    >
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart
          data={years}
          onClick={handleBarChartClick}
          style={{ cursor: 'pointer' }}
          margin={compact ? { top: 8, right: 8, left: 0, bottom: 0 } : { top: 8, right: 16, left: 8, bottom: 0 }}
        >
          <XAxis dataKey='year' tick={{ fontSize: 12 }} />
          <YAxis width={compact ? 40 : 56} tick={{ fontSize: 12 }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
          <Tooltip formatter={tooltipFormatter} labelFormatter={(label) => `Año ${label}`} />
          <Bar dataKey='totalAmount' radius={[6, 6, 0, 0]} maxBarSize={64}>
            {years.map((yearData, index) => (
              <Cell key={yearData.year} fill={chartColors[index % chartColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}

export default HistoricBarChart
