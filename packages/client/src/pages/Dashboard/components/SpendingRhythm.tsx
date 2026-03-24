import React from 'react'
import { useTheme } from '@mui/material/styles'
import { Grid, Grow, Typography, Stack } from '@mui/material'
import { CalendarOutlined, ThunderboltOutlined } from '@ant-design/icons'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import { format } from 'utils'
import MainCard from 'components/MainCard'
import { type DashboardStats } from 'hooks'
import KpiCard from './KpiCard'
import SectionTitle from './SectionTitle'
import { VelocityTooltip } from './chartTooltips'
import { hoverCardSx } from './shared'

interface SpendingRhythmProps {
  stats: DashboardStats
  chartHeight: number
}

const SpendingRhythm = ({ stats, chartHeight }: SpendingRhythmProps) => {
  const theme = useTheme()
  const now = new Date()

  const velocityData = (() => {
    const maxDays = Math.max(
      stats.expenseVelocity.currentMonth.length,
      stats.expenseVelocity.previousMonth.length
    )
    const today = now.getDate()
    const data = []
    for (let i = 0; i < maxDays; i++) {
      const current = stats.expenseVelocity.currentMonth[i]
      const previous = stats.expenseVelocity.previousMonth[i]
      if (i + 1 > today && !previous) break
      data.push({
        day: i + 1,
        'Mes actual': current?.amount ?? null,
        'Mes anterior': previous?.amount ?? null
      })
    }
    return data
  })()

  return (
    <>
      <SectionTitle>Ritmo de gasto</SectionTitle>

      <Grow in timeout={950}>
        <Grid size={{ xs: 12, md: 8 }}>
          <MainCard
            title='Velocidad de gasto'
            sx={hoverCardSx}
            secondary={
              <Typography variant='body2' color='textSecondary'>Acumulado diario</Typography>
            }
          >
            {velocityData.length > 0
              ? (
                <ResponsiveContainer width='100%' height={chartHeight}>
                  <AreaChart data={velocityData}>
                    <CartesianGrid strokeDasharray='3 3' stroke={theme.palette.divider} />
                    <XAxis dataKey='day' tick={{ fontSize: 11 }} tickFormatter={v => `${v}`} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => format.euro(v)} width={75} />
                    <Tooltip content={<VelocityTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 13 }}
                      formatter={(value) => (
                        <Typography component='span' variant='body2'>{value}</Typography>
                      )}
                    />
                    <Area
                      type='monotone'
                      dataKey='Mes actual'
                      stroke={theme.palette.error.main}
                      fill={theme.palette.error.light}
                      fillOpacity={0.15}
                      strokeWidth={2}
                      dot={false}
                      animationDuration={800}
                      connectNulls={false}
                    />
                    <Area
                      type='monotone'
                      dataKey='Mes anterior'
                      stroke={theme.palette.grey[400]}
                      fill={theme.palette.grey[200]}
                      fillOpacity={0.1}
                      strokeWidth={2}
                      strokeDasharray='6 3'
                      dot={false}
                      animationDuration={800}
                      animationBegin={200}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                )
              : (
                <Typography variant='body1' color='textSecondary'>
                  No hay datos de gasto disponibles
                </Typography>
                )}
          </MainCard>
        </Grid>
      </Grow>

      <Grow in timeout={1000}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3} sx={{ height: '100%' }}>
            <KpiCard
              title='Gasto diario medio'
              value={format.euro(stats.dailyAvgExpense)}
              subtitle={`Proyección: ${format.euro(stats.projectedMonthlyExpense)}`}
              icon={<CalendarOutlined />}
              color='warning'
            />
            <KpiCard
              title='Colchón financiero'
              value={`${stats.cashRunwayMonths} meses`}
              subtitle='Al ritmo de gasto actual'
              icon={<ThunderboltOutlined />}
              color={stats.cashRunwayMonths >= 6 ? 'success' : stats.cashRunwayMonths >= 3 ? 'warning' : 'error'}
            />
          </Stack>
        </Grid>
      </Grow>
    </>
  )
}

export default SpendingRhythm
