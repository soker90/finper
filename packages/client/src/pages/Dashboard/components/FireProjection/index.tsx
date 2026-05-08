import { useState } from 'react'
import { useTheme } from '@mui/material/styles'
import { Grid, Grow, Typography, Stack, TextField, CircularProgress, Alert } from '@mui/material'
import { RocketOutlined, DollarOutlined, ClockCircleOutlined, PercentageOutlined } from '@ant-design/icons'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine
} from 'recharts'
import { format } from 'utils'
import MainCard from 'components/MainCard'
import { useFireProjection, useDashboardStats, useDebouncedValue } from 'hooks'
import KpiCard from '../KpiCard'
import SectionTitle from '../SectionTitle'
import { hoverCardSx } from '../shared'

const DEBOUNCE_MS = 600
const DEFAULT_ANNUAL_RETURN_RATE = 7
const DEFAULT_WITHDRAWAL_RATE = 4

interface FireProjectionProps {
  chartHeight: number
}

const FireProjection = ({ chartHeight }: FireProjectionProps) => {
  const theme = useTheme()
  const { stats } = useDashboardStats()

  const [monthlyContribution, setMonthlyContribution] = useState<number>(500)
  const [annualReturnRate, setAnnualReturnRate] = useState<number>(DEFAULT_ANNUAL_RETURN_RATE)

  const debouncedMonthlyContribution = useDebouncedValue(monthlyContribution, DEBOUNCE_MS)
  const debouncedAnnualReturnRate = useDebouncedValue(annualReturnRate, DEBOUNCE_MS)

  const { projection, loading, error } = useFireProjection({
    currentBalance: stats?.totalBalance ?? 0,
    annualExpenses: stats ? (stats as any).annualExpenses ?? 24000 : 24000,
    monthlyContribution: debouncedMonthlyContribution,
    annualReturnRate: debouncedAnnualReturnRate,
    withdrawalRate: DEFAULT_WITHDRAWAL_RATE,
    totalDebts: (stats as any)?.totalDebts ?? 0,
    totalLoansPending: (stats as any)?.totalLoansPending ?? 0,
    totalReceivable: (stats as any)?.totalReceivable ?? 0
  })

  const chartData = projection?.projectionPoints.map((point) => ({
    year: point.year,
    'Patrimonio proyectado': point.netWorth,
    'Objetivo FIRE': point.fireTarget
  })) ?? []

  const fireReachedYear = projection?.projectionPoints.find((point) => point.isFireReached)?.year

  return (
    <>
      <SectionTitle>Proyección FIRE</SectionTitle>

      <Grow in timeout={1050}>
        <Grid size={{ xs: 12, md: 8 }}>
          <MainCard
            title='Proyección de independencia financiera'
            sx={hoverCardSx}
            secondary={
              <Stack direction='row' spacing={2}>
                <TextField
                  label='Aportación mensual (€)'
                  type='number'
                  size='small'
                  value={monthlyContribution}
                  onChange={(event) => setMonthlyContribution(Number(event.target.value))}
                  inputProps={{ min: 0, step: 50 }}
                  sx={{ width: 180 }}
                />
                <TextField
                  label='Rentabilidad anual (%)'
                  type='number'
                  size='small'
                  value={annualReturnRate}
                  onChange={(event) => setAnnualReturnRate(Number(event.target.value))}
                  inputProps={{ min: 0, max: 100, step: 0.5 }}
                  sx={{ width: 160 }}
                />
              </Stack>
            }
          >
            {loading && (
              <Stack alignItems='center' justifyContent='center' sx={{ height: chartHeight }}>
                <CircularProgress />
              </Stack>
            )}
            {error && (
              <Alert severity='error'>Error al cargar la proyección FIRE</Alert>
            )}
            {!loading && !error && chartData.length > 0 && (
              <ResponsiveContainer width='100%' height={chartHeight}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray='3 3' stroke={theme.palette.divider} />
                  <XAxis dataKey='year' tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => format.euro(value)} width={90} />
                  <Tooltip
                    formatter={(value, name) => [format.euro(Number(value)), String(name)]}
                    labelFormatter={(label) => `Año ${label}`}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 13 }}
                    formatter={(value) => (
                      <Typography component='span' variant='body2'>{value}</Typography>
                    )}
                  />
                  {fireReachedYear && (
                    <ReferenceLine
                      x={fireReachedYear}
                      stroke={theme.palette.success.main}
                      strokeDasharray='4 4'
                      label={{ value: `FIRE ${fireReachedYear}`, position: 'top', fontSize: 11, fill: theme.palette.success.main }}
                    />
                  )}
                  <Line
                    type='monotone'
                    dataKey='Patrimonio proyectado'
                    stroke={theme.palette.primary.main}
                    strokeWidth={2}
                    dot={false}
                    animationDuration={800}
                  />
                  <Line
                    type='monotone'
                    dataKey='Objetivo FIRE'
                    stroke={theme.palette.warning.main}
                    strokeWidth={2}
                    strokeDasharray='6 3'
                    dot={false}
                    animationDuration={800}
                    animationBegin={200}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </MainCard>
        </Grid>
      </Grow>

      <Grow in timeout={1100}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3} sx={{ height: '100%' }}>
            <KpiCard
              title='Patrimonio neto'
              value={format.euro(projection?.netWorth ?? 0)}
              subtitle='Balance − deudas + cobros pendientes'
              icon={<DollarOutlined />}
              color='primary'
            />
            <KpiCard
              title='Objetivo FIRE'
              value={format.euro(projection?.fireTarget ?? 0)}
              subtitle={`Regla del ${DEFAULT_WITHDRAWAL_RATE}%`}
              icon={<RocketOutlined />}
              color='warning'
            />
            <KpiCard
              title='Años para FIRE'
              value={projection?.yearsToFire != null ? `${projection.yearsToFire} años` : '> 40 años'}
              subtitle={fireReachedYear ? `Estimado en ${fireReachedYear}` : 'Aumenta tu ahorro mensual'}
              icon={<ClockCircleOutlined />}
              color={projection?.yearsToFire != null && projection.yearsToFire <= 15 ? 'success' : projection?.yearsToFire != null && projection.yearsToFire <= 25 ? 'warning' : 'error'}
            />
            <KpiCard
              title='Tasa de retiro'
              value={`${DEFAULT_WITHDRAWAL_RATE}%`}
              subtitle='Porcentaje de retiro anual seguro'
              icon={<PercentageOutlined />}
              color='info'
            />
          </Stack>
        </Grid>
      </Grow>
    </>
  )
}

export default FireProjection
