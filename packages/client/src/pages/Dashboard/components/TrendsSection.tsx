import { useNavigate } from 'react-router'
import { useTheme } from '@mui/material/styles'
import { Grid, Grow, Typography, Box, Stack, Avatar, Button, Chip, Divider } from '@mui/material'
import { FileTextOutlined, ClockCircleOutlined, DollarOutlined, BankOutlined } from '@ant-design/icons'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { format } from 'utils'
import MainCard from 'components/MainCard'
import { type DashboardStats } from 'hooks'
import { type Ticket } from 'types'
import SectionTitle from './SectionTitle'
import MiniKpi from './MiniKpi'
import { ChartTooltip } from './chartTooltips'
import { hoverCardSx } from './shared'

interface TrendsSectionProps {
  stats: DashboardStats
  tickets: Ticket[]
  ticketsEnabled: boolean
  ticketsLoading: boolean
  chartHeight: number
}

const TrendsSection = ({ stats, tickets, ticketsEnabled, ticketsLoading, chartHeight }: TrendsSectionProps) => {
  const theme = useTheme()
  const navigate = useNavigate()

  const last6MonthsChart = stats.last6Months.map(m => ({
    month: format.monthShort(m.month - 1),
    income: m.income,
    expenses: m.expenses
  }))

  return (
    <>
      <SectionTitle>Tendencias</SectionTitle>
      <Grow in timeout={800}>
        <Grid size={{ xs: 12, md: 8 }}>
          <MainCard title='Ingresos vs Gastos — últimos 6 meses' sx={hoverCardSx}>
            <ResponsiveContainer width='100%' height={chartHeight}>
              <BarChart data={last6MonthsChart} barGap={4}>
                <XAxis dataKey='month' tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={v => format.euro(v)}
                  width={80}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Legend
                  wrapperStyle={{ fontSize: 14 }}
                  formatter={(value) => (
                    <Typography component='span' variant='body2'>{value}</Typography>
                  )}
                />
                <Bar
                  dataKey='income'
                  name='Ingresos'
                  fill={theme.palette.success.main}
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
                />
                <Bar
                  dataKey='expenses'
                  name='Gastos'
                  fill={theme.palette.error.main}
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
                  animationBegin={200}
                />
              </BarChart>
            </ResponsiveContainer>
          </MainCard>
        </Grid>
      </Grow>
      <Grow in timeout={900}>
        <Grid size={{ xs: 12, md: 4 }}>
          <MainCard
            sx={{ ...hoverCardSx, height: '100%' }}
            contentSX={{ p: 2.5, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}
          >
            <Stack spacing={1} sx={{ flex: 1, justifyContent: 'space-around' }}>
              {/* Tickets */}
              {ticketsEnabled && (
                <>
                  <Stack
                    direction='row'
                    spacing={1.5}
                    sx={{
                      alignItems: 'center',
                      py: 1
                    }}
                  >
                    <Avatar sx={{ bgcolor: tickets.length > 0 ? 'warning.lighter' : 'success.lighter', width: 32, height: 32 }}>
                      <FileTextOutlined style={{ fontSize: 14, color: tickets.length > 0 ? '#faad14' : '#52c41a' }} />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant='body2' color='textSecondary'>Tickets pendientes</Typography>
                      <Typography variant='subtitle1'>{ticketsLoading ? '...' : tickets.length}</Typography>
                    </Box>
                    {tickets.length > 0 && (
                      <Button
                        variant='outlined'
                        size='small'
                        color='warning'
                        onClick={() => navigate('/tickets')}
                        startIcon={<ClockCircleOutlined />}
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        Revisar
                      </Button>
                    )}
                    {tickets.length === 0 && (
                      <Chip size='small' label='Al día' color='success' />
                    )}
                  </Stack>

                  <Divider />
                </>
              )}

              {/* Tasa de ahorro */}
              <MiniKpi
                title='Tasa de Ahorro (mes actual)'
                value={`${stats.savingsRate.toFixed(1)}%`}
                icon={<DollarOutlined />}
                color={stats.savingsRate >= 20 ? 'success' : 'warning'}
              />

              <Divider />

              {/* Deudas */}
              <MiniKpi
                title='Deudas Totales'
                value={format.euro(stats.totalDebts)}
                icon={<BankOutlined />}
                color='error'
              />
            </Stack>
          </MainCard>
        </Grid>
      </Grow>
    </>
  )
}

export default TrendsSection
