import React from 'react'
import { useNavigate } from 'react-router'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import {
  Grid,
  Typography,
  Box,
  Chip,
  Stack,
  Avatar,
  LinearProgress,
  Divider,
  Button,
  Skeleton,
  Grow,
  Fade,
  Alert
} from '@mui/material'
import {
  RiseOutlined,
  FallOutlined,
  BankOutlined,
  WalletOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  PieChartOutlined,
  DollarOutlined,
  SafetyOutlined,
  WarningOutlined,
  ReloadOutlined,
  ShopOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  DashboardOutlined
} from '@ant-design/icons'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
  Area,
  AreaChart
} from 'recharts'
import { useDashboardStats, type HealthScore } from 'hooks'
import { useTickets, useAccounts } from 'hooks'
import { usePensions } from '../Pensions/hooks'
import { useBudgets } from '../Budgets/hooks'
import { format } from 'utils'
import MainCard from 'components/MainCard'

// ── Colores de gráficos desde el theme ──
const useChartColors = () => {
  const theme = useTheme()
  return [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
    theme.palette.secondary.main,
    theme.palette.primary.dark
  ]
}

// ── Tooltip custom para gráficos ──
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        p: 1.5,
        borderRadius: 2,
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        minWidth: 140
      }}
    >
      <Typography variant='subtitle2' sx={{ mb: 0.5 }}>{label}</Typography>
      {payload.map((entry: any) => (
        <Stack key={entry.name} direction='row' justifyContent='space-between' spacing={2} sx={{ mt: 0.25 }}>
          <Stack direction='row' alignItems='center' gap={0.75}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color }} />
            <Typography variant='body2' color='textSecondary'>{entry.name}</Typography>
          </Stack>
          <Typography variant='body2' fontWeight={600}>{format.euro(Number(entry.value))}</Typography>
        </Stack>
      ))}
    </Box>
  )
}

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        p: 1.5,
        borderRadius: 2,
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        minWidth: 120
      }}
    >
      <Stack direction='row' alignItems='center' gap={0.75} sx={{ mb: 0.25 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.payload.fill }} />
        <Typography variant='body2' fontWeight={600}>{entry.name}</Typography>
      </Stack>
      <Typography variant='body1' fontWeight={600}>{format.euro(Number(entry.value))}</Typography>
    </Box>
  )
}

const VelocityTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        p: 1.5,
        borderRadius: 2,
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        minWidth: 140
      }}
    >
      <Typography variant='subtitle2' sx={{ mb: 0.5 }}>Día {label}</Typography>
      {payload.map((entry: any) => (
        <Stack key={entry.name} direction='row' justifyContent='space-between' spacing={2} sx={{ mt: 0.25 }}>
          <Stack direction='row' alignItems='center' gap={0.75}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color }} />
            <Typography variant='body2' color='textSecondary'>{entry.name}</Typography>
          </Stack>
          <Typography variant='body2' fontWeight={600}>{format.euro(Number(entry.value))}</Typography>
        </Stack>
      ))}
    </Box>
  )
}

// ── Trend chip ──
const trendChip = (current: number, previous: number, invertPositive = false) => {
  if (!previous) return null
  const pct = ((current - previous) / previous) * 100
  const isUp = pct >= 0
  const isPositive = invertPositive ? !isUp : isUp
  return (
    <Chip
      size='small'
      icon={isUp ? <RiseOutlined style={{ fontSize: '0.75rem' }} /> : <FallOutlined style={{ fontSize: '0.75rem' }} />}
      label={`${Math.abs(pct).toFixed(1)}%`}
      color={isPositive ? 'success' : 'error'}
      sx={{ ml: 1, height: 22, fontSize: '0.75rem' }}
    />
  )
}

// ── KPI Card ──
interface KpiCardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  trend?: React.ReactNode
  color?: string
}

const hoverCardSx = {
  transition: 'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
  }
}

const KpiCard = ({ title, value, subtitle, icon, trend, color = 'primary' }: KpiCardProps) => (
  <MainCard contentSX={{ p: 2.25 }} sx={hoverCardSx}>
    <Stack spacing={0.5}>
      <Stack direction='row' alignItems='center' justifyContent='space-between'>
        <Typography variant='body1' color='textSecondary'>
          {title}
        </Typography>
        <Avatar sx={{ bgcolor: `${color}.lighter`, color: `${color}.main`, width: 36, height: 36 }}>
          {icon}
        </Avatar>
      </Stack>
      <Stack direction='row' alignItems='center'>
        <Typography variant='h4'>{value}</Typography>
        {trend}
      </Stack>
      <Typography variant='body2' color='textSecondary'>{subtitle}</Typography>
    </Stack>
  </MainCard>
)

// ── Mini KPI (para panel lateral) ──
const MiniKpi = ({ title, value, icon, color = 'primary' }: { title: string, value: string, icon: React.ReactNode, color?: string }) => (
  <Stack direction='row' alignItems='center' spacing={1.5} sx={{ py: 1 }}>
    <Avatar sx={{ bgcolor: `${color}.lighter`, color: `${color}.main`, width: 32, height: 32 }}>
      {icon}
    </Avatar>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant='body2' color='textSecondary' noWrap>{title}</Typography>
      <Typography variant='subtitle1'>{value}</Typography>
    </Box>
  </Stack>
)

// ── Separador de sección ──
const SectionTitle = ({ children }: { children: string }) => (
  <Grid size={{ xs: 12 }}>
    <Typography
      variant='overline'
      color='textSecondary'
      sx={{ letterSpacing: 1.5, fontSize: '0.7rem' }}
    >
      {children}
    </Typography>
  </Grid>
)

// ── Loading Skeletons ──
const DashboardSkeleton = () => (
  <Grid container spacing={3}>
    {[...Array(4)].map((_, i) => (
      <Grid key={`kpi-${i}`} size={{ xs: 12, sm: 6, md: 3 }}>
        <MainCard contentSX={{ p: 2.25 }}>
          <Stack spacing={1}>
            <Stack direction='row' justifyContent='space-between' alignItems='center'>
              <Skeleton variant='text' width='60%' height={20} />
              <Skeleton variant='circular' width={36} height={36} />
            </Stack>
            <Skeleton variant='text' width='45%' height={32} />
            <Skeleton variant='text' width='70%' height={14} />
          </Stack>
        </MainCard>
      </Grid>
    ))}
    <Grid size={{ xs: 12, md: 8 }}>
      <MainCard>
        <Skeleton variant='text' width='30%' height={20} sx={{ mb: 1 }} />
        <Stack direction='row' alignItems='flex-end' spacing={1} sx={{ height: 260 }}>
          {[...Array(12)].map((_, i) => (
            <Skeleton key={`bar-${i}`} variant='rounded' width='100%' height={60 + Math.random() * 180} sx={{ borderRadius: 1 }} />
          ))}
        </Stack>
      </MainCard>
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <MainCard>
        <Stack spacing={2.5} sx={{ py: 1 }}>
          {[...Array(3)].map((_, i) => (
            <Stack key={`mini-${i}`} direction='row' alignItems='center' spacing={1.5}>
              <Skeleton variant='circular' width={32} height={32} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant='text' width='60%' height={14} />
                <Skeleton variant='text' width='40%' height={20} />
              </Box>
            </Stack>
          ))}
        </Stack>
      </MainCard>
    </Grid>
    {[5, 4, 3].map((md, i) => (
      <Grid key={`skel-card-${i}`} size={{ xs: 12, md }}>
        <Skeleton variant='rounded' height={240} sx={{ borderRadius: 2 }} />
      </Grid>
    ))}
    <Grid size={{ xs: 12 }}>
      <Skeleton variant='rounded' height={180} sx={{ borderRadius: 2 }} />
    </Grid>
  </Grid>
)

// ── Error State ──
const DashboardError = ({ error, onRetry }: { error: any, onRetry: () => void }) => (
  <Fade in timeout={400}>
    <Box>
      <MainCard>
        <Stack alignItems='center' spacing={3} sx={{ py: 6 }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'error.lighter' }}>
            <WarningOutlined style={{ fontSize: 32, color: '#f5222d' }} />
          </Avatar>
          <Stack alignItems='center' spacing={1}>
            <Typography variant='h5'>Error al cargar el dashboard</Typography>
            <Typography variant='body1' color='textSecondary' align='center' sx={{ maxWidth: 400 }}>
              No se pudieron cargar los datos financieros. Comprueba tu conexión e inténtalo de nuevo.
            </Typography>
          </Stack>
          {error?.message && (
            <Alert severity='error' sx={{ maxWidth: 400 }}>
              {error.message}
            </Alert>
          )}
          <Button
            variant='contained'
            startIcon={<ReloadOutlined />}
            onClick={onRetry}
          >
            Reintentar
          </Button>
        </Stack>
      </MainCard>
    </Box>
  </Fade>
)

// ── Health Score computation ──
const computeHealthScore = (
  savingsRate: number,
  totalDebts: number,
  totalBalance: number,
  budgetAdherencePct: number,
  cashRunwayMonths: number,
  pensionReturnPct: number
): HealthScore => {
  // Savings rate: 0-100 scale. 20%+ savings rate = 100 points
  const savingsScore = Math.min(Math.max(savingsRate / 20, 0), 1) * 100

  // Debt ratio: 0-100 scale. 0 debt = 100, debt > balance = 0
  const debtRatio = totalBalance > 0 ? totalDebts / totalBalance : (totalDebts > 0 ? 1 : 0)
  const debtScore = Math.max(0, (1 - debtRatio)) * 100

  // Budget adherence: already 0-100. Under budget = high score
  const budgetScore = Math.min(budgetAdherencePct, 100)

  // Cash runway: 0-100. 6+ months = 100
  const runwayScore = Math.min(cashRunwayMonths / 6, 1) * 100

  // Pension return: 0-100. 5%+ return = 100
  const pensionScore = Math.min(Math.max(pensionReturnPct / 5, 0), 1) * 100

  const total = Math.round(
    savingsScore * 0.25 +
    debtScore * 0.2 +
    budgetScore * 0.2 +
    runwayScore * 0.2 +
    pensionScore * 0.15
  )

  return {
    total,
    savingsRate: Math.round(savingsScore),
    debtRatio: Math.round(debtScore),
    budgetAdherence: Math.round(budgetScore),
    cashRunway: Math.round(runwayScore),
    pensionReturn: Math.round(pensionScore)
  }
}

const getScoreColor = (score: number): 'success' | 'warning' | 'error' => {
  if (score >= 70) return 'success'
  if (score >= 40) return 'warning'
  return 'error'
}

const getScoreLabel = (score: number): string => {
  if (score >= 80) return 'Excelente'
  if (score >= 60) return 'Buena'
  if (score >= 40) return 'Regular'
  return 'Necesita atención'
}

// ── Constantes ──
const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const now = new Date()
const currentYear = String(now.getFullYear())
const currentMonth = String(now.getMonth())

// ── Budget progress bars (reusable for expenses & incomes) ──
const BudgetProgressList = ({
  rows,
  emptyMessage
}: {
  rows: Array<{ name: string; real: number; estimated: number; pct: number; over: boolean }>
  emptyMessage: string
}) => {
  if (rows.length === 0) {
    return <Typography variant='body1' color='textSecondary'>{emptyMessage}</Typography>
  }
  return (
    <Stack spacing={2}>
      {rows.map(row => (
        <Box key={row.name}>
          <Stack direction='row' justifyContent='space-between' sx={{ mb: 0.5 }}>
            <Typography variant='body1'>{row.name}</Typography>
            <Typography variant='body1' color={row.over ? 'error.main' : 'textSecondary'}>
              {format.euro(row.real)}
              <Typography component='span' variant='body2' color='textSecondary'>
                {' '}/ {format.euro(row.estimated)}
              </Typography>
            </Typography>
          </Stack>
          <LinearProgress
            variant='determinate'
            value={row.pct}
            color={row.over ? 'error' : row.pct > 80 ? 'warning' : 'success'}
            sx={{ borderRadius: 1, height: 6 }}
          />
        </Box>
      ))}
    </Stack>
  )
}

// ── Dashboard ──
const Dashboard = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  const chartColors = useChartColors()

  const { stats, loading, error, retry } = useDashboardStats()
  const { tickets, isLoading: ticketsLoading } = useTickets()
  const { accounts, isLoading: accountsLoading } = useAccounts()
  const { pension } = usePensions()
  const {
    expenses: budgetExpenses,
    incomes: budgetIncomes,
    totalsExpenses,
    totalsIncomes,
    isLoading: budgetLoading
  } = useBudgets({
    year: currentYear,
    month: currentMonth
  })

  const isLoading = loading || ticketsLoading || accountsLoading || budgetLoading

  if (isLoading) return <DashboardSkeleton />
  if (error) return <DashboardError error={error} onRetry={retry} />

  // ── Alturas de gráficos responsive ──
  const chartHeight = isMobile ? 200 : isTablet ? 260 : 300
  const pieHeight = isMobile ? 200 : 240

  // ── KPI tendencias ──
  const incomeTrend = stats
    ? trendChip(stats.monthlyTrend.income.current, stats.monthlyTrend.income.previous)
    : null
  const expensesTrend = stats
    ? trendChip(stats.monthlyTrend.expenses.current, stats.monthlyTrend.expenses.previous, true)
    : null

  // ── Adaptar last6Months al formato { month: string } que usa el BarChart ──
  const last6MonthsChart = (stats?.last6Months ?? []).map(m => ({
    month: MONTH_NAMES[m.month - 1],  // month es 1-indexed desde la API
    income: m.income,
    expenses: m.expenses
  }))

  // ── Datos PieChart cuentas ──
  const pieData = (accounts || [])
    .filter(a => a.balance > 0)
    .slice(0, 7)
    .map(a => ({ name: a.name, value: a.balance }))

  // ── Datos presupuesto gastos ──
  const budgetExpenseRows = budgetExpenses
    .filter(b => b.budgets?.[0]?.amount > 0)
    .slice(0, 6)
    .map(b => {
      const estimated = b.budgets?.[0]?.amount ?? 0
      const real = b.budgets?.[0]?.real ?? 0
      const pct = estimated > 0 ? Math.min((real / estimated) * 100, 100) : 0
      return { name: b.name, real, estimated, pct, over: real > estimated }
    })

  const budgetExpenseTotal = {
    real: totalsExpenses?.budgets?.[0]?.real ?? 0,
    estimated: totalsExpenses?.budgets?.[0]?.amount ?? 0
  }

  // ── Datos presupuesto ingresos ──
  const budgetIncomeRows = budgetIncomes
    .filter(b => b.budgets?.[0]?.amount > 0)
    .slice(0, 6)
    .map(b => {
      const estimated = b.budgets?.[0]?.amount ?? 0
      const real = b.budgets?.[0]?.real ?? 0
      const pct = estimated > 0 ? Math.min((real / estimated) * 100, 100) : 0
      return { name: b.name, real, estimated, pct, over: false }
    })

  const budgetIncomeTotal = {
    real: totalsIncomes?.budgets?.[0]?.real ?? 0,
    estimated: totalsIncomes?.budgets?.[0]?.amount ?? 0
  }

  // ── Budget adherence for health score ──
  const budgetAdherencePct = budgetExpenseTotal.estimated > 0
    ? Math.max(0, 100 - ((budgetExpenseTotal.real / budgetExpenseTotal.estimated) * 100 - 100))
    : 100

  // ── Rentabilidad pensión ──
  const pensionContributed = (pension?.employeeAmount ?? 0) + (pension?.companyAmount ?? 0)
  const pensionReturn = pension && pensionContributed > 0
    ? ((pension.total - pensionContributed) / pensionContributed) * 100
    : 0

  // ── Pension sparkline data ──
  const pensionSparkline = (pension?.transactions ?? [])
    .sort((a, b) => a.date - b.date)
    .slice(-12)
    .map(t => ({
      date: new Date(t.date).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
      value: t.value * (t.employeeUnits + t.companyUnits)
    }))

  // ── Velocity chart data ──
  const velocityData = (() => {
    if (!stats) return []
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

  // ── Health score ──
  const healthScore = computeHealthScore(
    stats?.savingsRate ?? 0,
    stats?.totalDebts ?? 0,
    stats?.totalBalance ?? 0,
    budgetAdherencePct,
    stats?.cashRunwayMonths ?? 0,
    pensionReturn
  )

  const gaugeData = [
    { name: 'Score', value: healthScore.total, fill: theme.palette[getScoreColor(healthScore.total)].main }
  ]

  return (
    <Grid container spacing={3}>

      {/* ══════════ Fila 1: KPIs principales ══════════ */}
      <SectionTitle>Resumen</SectionTitle>

      <Grow in timeout={400}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title='Balance Total'
            value={format.euro(stats?.totalBalance ?? 0)}
            subtitle='Suma de todas las cuentas'
            icon={<WalletOutlined />}
            color='primary'
          />
        </Grid>
      </Grow>

      <Grow in timeout={500}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title='Patrimonio Neto'
            value={format.euro(stats?.netWorth ?? 0)}
            subtitle='Balance menos deudas'
            icon={<SafetyOutlined />}
            color='success'
          />
        </Grid>
      </Grow>

      <Grow in timeout={600}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title='Ingresos del Mes'
            value={format.euro(stats?.monthlyIncome ?? 0)}
            subtitle='Mes actual'
            icon={<ArrowUpOutlined />}
            trend={incomeTrend}
            color='success'
          />
        </Grid>
      </Grow>

      <Grow in timeout={700}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title='Gastos del Mes'
            value={format.euro(stats?.monthlyExpenses ?? 0)}
            subtitle='Mes actual'
            icon={<ArrowDownOutlined />}
            trend={expensesTrend}
            color='error'
          />
        </Grid>
      </Grow>

      {/* ══════════ Fila 2: Gráfico barras + panel lateral ══════════ */}
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
          <MainCard sx={{ ...hoverCardSx, height: '100%' }} contentSX={{ p: 2.5, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            <Stack spacing={1} sx={{ flex: 1, justifyContent: 'space-around' }}>
              {/* Tickets */}
              <Stack direction='row' alignItems='center' spacing={1.5} sx={{ py: 1 }}>
                <Avatar sx={{ bgcolor: tickets.length > 0 ? 'warning.lighter' : 'success.lighter', width: 32, height: 32 }}>
                  <FileTextOutlined style={{ fontSize: 14, color: tickets.length > 0 ? '#faad14' : '#52c41a' }} />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant='body2' color='textSecondary'>Tickets pendientes</Typography>
                  <Typography variant='subtitle1'>{tickets.length}</Typography>
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

              {/* Tasa de ahorro */}
              <MiniKpi
                title='Tasa de Ahorro'
                value={`${stats?.savingsRate ?? 0}%`}
                icon={<DollarOutlined />}
                color={((stats?.savingsRate ?? 0) >= 20) ? 'success' : 'warning'}
              />

              <Divider />

              {/* Deudas */}
              <MiniKpi
                title='Deudas Totales'
                value={format.euro(stats?.totalDebts ?? 0)}
                icon={<BankOutlined />}
                color='error'
              />
            </Stack>
          </MainCard>
        </Grid>
      </Grow>

      {/* ══════════ Fila 3: Velocidad de gasto + KPIs de ritmo ══════════ */}
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
                    <XAxis
                      dataKey='day'
                      tick={{ fontSize: 11 }}
                      tickFormatter={v => `${v}`}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={v => format.euro(v)}
                      width={75}
                    />
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
              value={format.euro(stats?.dailyAvgExpense ?? 0)}
              subtitle={`Proyección: ${format.euro(stats?.projectedMonthlyExpense ?? 0)}`}
              icon={<CalendarOutlined />}
              color='warning'
            />
            <KpiCard
              title='Colchón financiero'
              value={`${stats?.cashRunwayMonths ?? 0} meses`}
              subtitle='Al ritmo de gasto actual'
              icon={<ThunderboltOutlined />}
              color={(stats?.cashRunwayMonths ?? 0) >= 6 ? 'success' : (stats?.cashRunwayMonths ?? 0) >= 3 ? 'warning' : 'error'}
            />
          </Stack>
        </Grid>
      </Grow>

      {/* ══════════ Fila 4: Presupuesto gastos + Presupuesto ingresos + Distribución cuentas + Pensión ══════════ */}
      <SectionTitle>Presupuesto y distribución</SectionTitle>

      <Grow in timeout={1100}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MainCard
            title='Presupuesto gastos'
            sx={{ ...hoverCardSx, height: '100%' }}
            secondary={
              budgetExpenseTotal.estimated > 0
                ? (
                  <Chip
                    size='small'
                    label={`${format.euro(budgetExpenseTotal.real)} / ${format.euro(budgetExpenseTotal.estimated)}`}
                    color={budgetExpenseTotal.real > budgetExpenseTotal.estimated ? 'error' : 'success'}
                  />
                  )
                : undefined
            }
          >
            <BudgetProgressList
              rows={budgetExpenseRows}
              emptyMessage='Sin presupuesto de gastos'
            />
          </MainCard>
        </Grid>
      </Grow>

      <Grow in timeout={1150}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MainCard
            title='Presupuesto ingresos'
            sx={{ ...hoverCardSx, height: '100%' }}
            secondary={
              budgetIncomeTotal.estimated > 0
                ? (
                  <Chip
                    size='small'
                    label={`${format.euro(budgetIncomeTotal.real)} / ${format.euro(budgetIncomeTotal.estimated)}`}
                    color={budgetIncomeTotal.real >= budgetIncomeTotal.estimated ? 'success' : 'warning'}
                  />
                  )
                : undefined
            }
          >
            <BudgetProgressList
              rows={budgetIncomeRows}
              emptyMessage='Sin presupuesto de ingresos'
            />
          </MainCard>
        </Grid>
      </Grow>

      <Grow in timeout={1200}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            <MainCard title='Distribución por cuentas' sx={hoverCardSx}>
              {pieData.length > 0
                ? (
                  <ResponsiveContainer width='100%' height={pieHeight}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx='50%'
                        cy='50%'
                        innerRadius={isMobile ? 45 : 50}
                        outerRadius={isMobile ? 70 : 80}
                        paddingAngle={3}
                        dataKey='value'
                        animationDuration={800}
                        animationBegin={400}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={chartColors[i % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                      <Legend
                        formatter={(value) => (
                          <Typography component='span' variant='body2'>{value}</Typography>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  )
                : (
                  <Typography variant='body1' color='textSecondary'>Sin cuentas con saldo positivo</Typography>
                  )}
            </MainCard>

            <MainCard
              title='Pensión' sx={hoverCardSx} secondary={
                <PieChartOutlined style={{ fontSize: 16, color: theme.palette.primary.main }} />
          }
            >
              {pension
                ? (
                  <Stack spacing={1.5}>
                    <Stack direction='row' justifyContent='space-between'>
                      <Typography variant='body1' color='textSecondary'>Valor total</Typography>
                      <Typography variant='subtitle1'>{format.euro(pension.total)}</Typography>
                    </Stack>
                    <Divider />
                    <Stack direction='row' justifyContent='space-between'>
                      <Typography variant='body1' color='textSecondary'>Aporte empleado</Typography>
                      <Typography variant='body1'>{format.euro(pension.employeeAmount)}</Typography>
                    </Stack>
                    <Stack direction='row' justifyContent='space-between'>
                      <Typography variant='body1' color='textSecondary'>Aporte empresa</Typography>
                      <Typography variant='body1'>{format.euro(pension.companyAmount)}</Typography>
                    </Stack>
                    <Divider />
                    <Stack direction='row' justifyContent='space-between' alignItems='center'>
                      <Typography variant='body1' color='textSecondary'>Rentabilidad</Typography>
                      <Chip
                        size='small'
                        icon={pensionReturn >= 0 ? <RiseOutlined style={{ fontSize: '0.75rem' }} /> : <FallOutlined style={{ fontSize: '0.75rem' }} />}
                        label={`${pensionReturn >= 0 ? '+' : ''}${pensionReturn.toFixed(2)}%`}
                        color={pensionReturn >= 0 ? 'success' : 'error'}
                      />
                    </Stack>
                    {/* Mini sparkline */}
                    {pensionSparkline.length > 1 && (
                      <>
                        <Divider />
                        <Box sx={{ mt: 1 }}>
                          <Typography variant='body2' color='textSecondary' sx={{ mb: 0.5 }}>
                            Evolución (últimos {pensionSparkline.length} aportes)
                          </Typography>
                          <ResponsiveContainer width='100%' height={60}>
                            <AreaChart data={pensionSparkline}>
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
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (!active || !payload?.length) return null
                                  const item = payload[0]
                                  return (
                                    <Box sx={{ bgcolor: 'background.paper', p: 1, borderRadius: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                      <Typography variant='caption' color='textSecondary'>{item.payload.date}</Typography>
                                      <Typography variant='body2' fontWeight={600}>{format.euro(Number(item.value))}</Typography>
                                    </Box>
                                  )
                                }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </Box>
                      </>
                    )}
                  </Stack>
                  )
                : (
                  <Typography variant='body1' color='textSecondary'>
                    Sin datos de pensión
                  </Typography>
                  )}
            </MainCard>
          </Stack>
        </Grid>
      </Grow>

      {/* ══════════ Fila 5: Top categorías + Top tiendas ══════════ */}
      <SectionTitle>Análisis del mes</SectionTitle>

      <Grow in timeout={1300}>
        <Grid size={{ xs: 12, md: 6 }}>
          <MainCard
            title='Top gastos por categoría' sx={hoverCardSx} secondary={
              <Typography variant='body2' color='textSecondary'>Este mes</Typography>
          }
          >
            {stats?.topExpenseCategories.length
              ? (
                <Stack spacing={2}>
                  {stats.topExpenseCategories.map((cat, i) => {
                    const max = stats.topExpenseCategories[0].amount
                    return (
                      <Box key={cat.name}>
                        <Stack direction='row' justifyContent='space-between' sx={{ mb: 0.5 }}>
                          <Stack direction='row' alignItems='center' gap={0.75}>
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: chartColors[i % chartColors.length]
                              }}
                            />
                            <Typography variant='body1'>{cat.name}</Typography>
                          </Stack>
                          <Typography variant='subtitle1'>{format.euro(cat.amount)}</Typography>
                        </Stack>
                        <LinearProgress
                          variant='determinate'
                          value={(cat.amount / max) * 100}
                          sx={{
                            borderRadius: 1,
                            height: 6,
                            '& .MuiLinearProgress-bar': { bgcolor: chartColors[i % chartColors.length] }
                          }}
                        />
                      </Box>
                    )
                  })}
                </Stack>
                )
              : (
                <Typography variant='body1' color='textSecondary'>
                  No hay gastos registrados este mes
                </Typography>
                )}
          </MainCard>
        </Grid>
      </Grow>

      <Grow in timeout={1350}>
        <Grid size={{ xs: 12, md: 6 }}>
          <MainCard
            title='Top tiendas' sx={hoverCardSx} secondary={
              <Stack direction='row' alignItems='center' gap={0.5}>
                <ShopOutlined style={{ fontSize: 14 }} />
                <Typography variant='body2' color='textSecondary'>Este mes</Typography>
              </Stack>
          }
          >
            {stats?.topStores.length
              ? (
                <Stack spacing={2}>
                  {stats.topStores.map((store, i) => {
                    const max = stats.topStores[0].amount
                    return (
                      <Box key={store.name}>
                        <Stack direction='row' justifyContent='space-between' sx={{ mb: 0.5 }}>
                          <Stack direction='row' alignItems='center' gap={0.75}>
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: chartColors[(i + 2) % chartColors.length]
                              }}
                            />
                            <Typography variant='body1'>{store.name}</Typography>
                          </Stack>
                          <Typography variant='subtitle1'>{format.euro(store.amount)}</Typography>
                        </Stack>
                        <LinearProgress
                          variant='determinate'
                          value={(store.amount / max) * 100}
                          sx={{
                            borderRadius: 1,
                            height: 6,
                            '& .MuiLinearProgress-bar': { bgcolor: chartColors[(i + 2) % chartColors.length] }
                          }}
                        />
                      </Box>
                    )
                  })}
                </Stack>
                )
              : (
                <Typography variant='body1' color='textSecondary'>
                  No hay tiendas registradas este mes
                </Typography>
                )}
          </MainCard>
        </Grid>
      </Grow>

      {/* ══════════ Fila 6: Score de salud financiera ══════════ */}
      <SectionTitle>Salud financiera</SectionTitle>

      <Grow in timeout={1400}>
        <Grid size={{ xs: 12, md: 5 }}>
          <MainCard
            title='Score financiero'
            sx={{ ...hoverCardSx, height: '100%' }}
            secondary={
              <Chip
                size='small'
                label={getScoreLabel(healthScore.total)}
                color={getScoreColor(healthScore.total)}
                icon={<DashboardOutlined style={{ fontSize: '0.8rem' }} />}
              />
            }
          >
            <Stack alignItems='center' spacing={1}>
              <Box sx={{ position: 'relative', width: '100%', maxWidth: 200 }}>
                <ResponsiveContainer width='100%' height={180}>
                  <RadialBarChart
                    cx='50%'
                    cy='85%'
                    innerRadius='60%'
                    outerRadius='100%'
                    startAngle={180}
                    endAngle={0}
                    barSize={16}
                    data={gaugeData}
                  >
                    <RadialBar
                      // @ts-ignore - background prop is valid but not typed
                      background={{ fill: theme.palette.grey[100] }}
                      dataKey='value'
                      cornerRadius={8}
                      animationDuration={1000}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: '12%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    textAlign: 'center'
                  }}
                >
                  <Typography variant='h3' fontWeight={700} color={`${getScoreColor(healthScore.total)}.main`}>
                    {healthScore.total}
                  </Typography>
                  <Typography variant='caption' color='textSecondary'>de 100</Typography>
                </Box>
              </Box>
              {/* Score breakdown */}
              <Stack spacing={0.75} sx={{ width: '100%', pt: 1 }}>
                {[
                  { label: 'Tasa de ahorro', value: healthScore.savingsRate, weight: '25%' },
                  { label: 'Ratio deuda', value: healthScore.debtRatio, weight: '20%' },
                  { label: 'Presupuesto', value: healthScore.budgetAdherence, weight: '20%' },
                  { label: 'Colchón', value: healthScore.cashRunway, weight: '20%' },
                  { label: 'Pensión', value: healthScore.pensionReturn, weight: '15%' }
                ].map(item => (
                  <Stack key={item.label} direction='row' alignItems='center' spacing={1}>
                    <Typography variant='body2' color='textSecondary' sx={{ minWidth: 100 }}>
                      {item.label}
                    </Typography>
                    <LinearProgress
                      variant='determinate'
                      value={item.value}
                      color={getScoreColor(item.value)}
                      sx={{ flex: 1, borderRadius: 1, height: 5 }}
                    />
                    <Typography variant='body2' fontWeight={600} sx={{ minWidth: 28, textAlign: 'right' }}>
                      {item.value}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </MainCard>
        </Grid>
      </Grow>

      <Grow in timeout={1450}>
        <Grid size={{ xs: 12, md: 7 }}>
          <MainCard title='Consejos' sx={{ ...hoverCardSx, height: '100%' }}>
            <Stack spacing={2}>
              {healthScore.savingsRate < 50 && (
                <Alert severity='warning' variant='outlined'>
                  Tu tasa de ahorro está por debajo del 10%. Intenta reducir gastos no esenciales.
                </Alert>
              )}
              {healthScore.debtRatio < 80 && (
                <Alert severity='info' variant='outlined'>
                  Tu nivel de deuda es significativo respecto a tus activos. Prioriza reducir deudas.
                </Alert>
              )}
              {healthScore.cashRunway < 50 && (
                <Alert severity='warning' variant='outlined'>
                  Tu colchón financiero cubre menos de 3 meses. Considera crear un fondo de emergencia.
                </Alert>
              )}
              {healthScore.budgetAdherence < 60 && (
                <Alert severity='error' variant='outlined'>
                  Estás por encima del presupuesto. Revisa tus categorías de gasto.
                </Alert>
              )}
              {healthScore.total >= 70 && (
                <Alert severity='success' variant='outlined'>
                  Tu salud financiera es buena. Mantén tus hábitos actuales.
                </Alert>
              )}
              {healthScore.pensionReturn < 30 && pensionContributed > 0 && (
                <Alert severity='info' variant='outlined'>
                  La rentabilidad de tu pensión es baja. Revisa las opciones de tu plan.
                </Alert>
              )}
            </Stack>
          </MainCard>
        </Grid>
      </Grow>

    </Grid>
  )
}

export default Dashboard
