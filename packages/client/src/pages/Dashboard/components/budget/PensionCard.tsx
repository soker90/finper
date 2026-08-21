import { useTheme } from '@mui/material/styles'
import { Stack, Box, Typography, Chip, Divider } from '@mui/material'
import { PieChartOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons'
import {
  AreaChart, Area, Tooltip, ResponsiveContainer
} from 'recharts'
import { format } from 'utils'
import MainCard from 'components/MainCard'
import { type PensionSummary } from 'hooks'
import { hoverCardSx } from '../shared'
import { PensionSparklineTooltip } from '../chartTooltips'

interface PensionCardProps {
  pension: PensionSummary | null
  pensionReturnPct: number
}

const PensionCard = ({ pension, pensionReturnPct }: PensionCardProps) => {
  const theme = useTheme()

  // Sum contributions per calendar month across every plan: mixing individual
  // movements from plans of very different sizes on the same series produces
  // phantom drops/spikes that don't reflect any real change in the portfolio.
  const monthlyTotals = new Map<number, { date: Date, value: number }>()
  for (const t of pension?.transactions ?? []) {
    const date = new Date(t.date)
    const monthKey = date.getFullYear() * 12 + date.getMonth()
    const contribution = t.value * (t.employeeUnits + t.companyUnits)
    const existing = monthlyTotals.get(monthKey)
    if (existing) {
      existing.value += contribution
    } else {
      monthlyTotals.set(monthKey, { date, value: contribution })
    }
  }

  const sparkline = Array.from(monthlyTotals.entries())
    .toSorted(([a], [b]) => a - b)
    .slice(-12)
    .map(([, { date, value }]) => ({
      date: date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
      value
    }))

  return (
    <MainCard
      title='Pensión'
      sx={hoverCardSx}
      secondary={<PieChartOutlined style={{ fontSize: 16, color: theme.palette.primary.main }} />}
    >
      {pension
        ? (
          <Stack spacing={1.5}>
            <Stack
              direction='row' sx={{
                justifyContent: 'space-between'
              }}
            >
              <Typography variant='body1' color='textSecondary'>Valor total</Typography>
              <Typography variant='subtitle1'>{format.euro(pension.total)}</Typography>
            </Stack>
            <Divider />
            <Stack
              direction='row' sx={{
                justifyContent: 'space-between'
              }}
            >
              <Typography variant='body1' color='textSecondary'>Aporte empleado</Typography>
              <Typography variant='body1'>{format.euro(pension.employeeAmount)}</Typography>
            </Stack>
            <Stack
              direction='row' sx={{
                justifyContent: 'space-between'
              }}
            >
              <Typography variant='body1' color='textSecondary'>Aporte empresa</Typography>
              <Typography variant='body1'>{format.euro(pension.companyAmount)}</Typography>
            </Stack>
            <Divider />
            <Stack
              direction='row'
              sx={{
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Typography variant='body1' color='textSecondary'>Rentabilidad</Typography>
              <Chip
                size='small'
                icon={pensionReturnPct >= 0
                  ? <RiseOutlined style={{ fontSize: '0.75rem' }} />
                  : <FallOutlined style={{ fontSize: '0.75rem' }} />}
                label={`${pensionReturnPct >= 0 ? '+' : ''}${pensionReturnPct.toFixed(2)}%`}
                color={pensionReturnPct >= 0 ? 'success' : 'error'}
              />
            </Stack>
            {sparkline.length > 1 && (
              <>
                <Divider />
                <Box sx={{ mt: 1 }}>
                  <Typography variant='body2' color='textSecondary' sx={{ mb: 0.5 }}>
                    Evolución (últimos {sparkline.length} meses con aportaciones)
                  </Typography>
                  <ResponsiveContainer width='100%' height={60}>
                    <AreaChart data={sparkline}>
                      <Area
                        type='monotone'
                        dataKey='value'
                        stroke={theme.palette.primary.main}
                        fill={theme.palette.primary.light}
                        fillOpacity={0.2}
                        strokeWidth={1.5}
                        dot={false}
                        animationDuration={800}
                      />
                      <Tooltip content={<PensionSparklineTooltip />} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </>
            )}
          </Stack>
          )
        : (
          <Typography variant='body1' color='textSecondary'>Sin datos de pensión</Typography>
          )}
    </MainCard>
  )
}

export default PensionCard
