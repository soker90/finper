import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { Grid } from '@mui/material'
import { useDashboardStats, useTickets, useAccounts } from 'hooks'
import { useBudgets } from '../Budgets/hooks'
import { useChartColors } from './components/shared'
import { DashboardSkeleton, DashboardError } from './components/DashboardStates'
import KpiSummary from './components/KpiSummary'
import NetWorthSection from './components/NetWorthSection'
import TrendsSection from './components/TrendsSection'
import SpendingRhythm from './components/SpendingRhythm'
import BudgetSection from './components/budget'
import MonthAnalysis from './components/month-analysis'
import HealthScoreSection from './components/health-score'
import LoansSection from './components/LoansSection'
import StocksWidget from './components/StocksWidget'
import GoalsWidget from './components/GoalsWidget'

const now = new Date()
const currentYear = String(now.getFullYear())
const currentMonthIndex = String(now.getMonth()) // 0-indexed, as expected by useBudgets

const Dashboard = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  const chartColors = useChartColors()

  const { stats, loading, error, retry } = useDashboardStats()
  const { tickets, isLoading: ticketsLoading } = useTickets()
  const { accounts, isLoading: accountsLoading } = useAccounts()
  const {
    expenses: budgetExpenses,
    incomes: budgetIncomes,
    totalsExpenses,
    totalsIncomes,
    isLoading: budgetLoading
  } = useBudgets({ year: currentYear, month: currentMonthIndex })

  const isLoading = loading || ticketsLoading || accountsLoading || budgetLoading

  if (isLoading) return <DashboardSkeleton />
  if (error || !stats) return <DashboardError error={error} onRetry={retry} />

  const chartHeight = isMobile ? 200 : isTablet ? 260 : 300

  return (
    <Grid container spacing={3}>
      <KpiSummary stats={stats} />

      <NetWorthSection netWorth={stats.netWorth} />

      <TrendsSection stats={stats} tickets={tickets ?? []} chartHeight={chartHeight} />

      <SpendingRhythm stats={stats} chartHeight={chartHeight} />

      <BudgetSection
        stats={stats}
        accounts={accounts ?? []}
        budgetExpenses={budgetExpenses}
        budgetIncomes={budgetIncomes}
        totalsExpenses={totalsExpenses}
        totalsIncomes={totalsIncomes}
        chartColors={chartColors}
        isMobile={isMobile}
      />

      <MonthAnalysis stats={stats} chartColors={chartColors} />

      <HealthScoreSection stats={stats} />

      <LoansSection />

      <GoalsWidget />

      <StocksWidget />
    </Grid>
  )
}

export default Dashboard
