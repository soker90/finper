import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { Grid } from '@mui/material'
import { useDashboardStats, useTickets, useAccounts } from 'hooks'
import { useBudgets } from '../Budgets/hooks'
import { useChartColors } from './components/shared'
import { DashboardSkeleton, DashboardError } from './components/DashboardStates'
import KpiSummary from './components/KpiSummary'
import LoansSection from './components/LoansSection'
import GoalsWidget from './components/GoalsWidget'
import TrendsSection from './components/TrendsSection'
import SpendingRhythm from './components/SpendingRhythm'
import BudgetSection from './components/budget'
import MonthAnalysis from './components/month-analysis'
import HealthScoreSection from './components/health-score'
import StocksWidget from './components/StocksWidget'

const now = new Date()
const currentYear = String(now.getFullYear())
const currentMonthIndex = String(now.getMonth()) // 0-indexed, as expected by useBudgets

const Dashboard = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  const chartColors = useChartColors()

  const { stats, loading, error, retry } = useDashboardStats()
  const { tickets, ticketsEnabled, isLoading: ticketsLoading } = useTickets()
  const { accounts, isLoading: accountsLoading } = useAccounts()
  const {
    expenses: budgetExpenses,
    incomes: budgetIncomes,
    totalsExpenses,
    totalsIncomes,
    isLoading: budgetLoading
  } = useBudgets({ year: currentYear, month: currentMonthIndex })

  if (loading) return <DashboardSkeleton />
  if (error || !stats) return <DashboardError error={error} onRetry={retry} />

  const chartHeight = isMobile ? 200 : isTablet ? 260 : 300

  return (
    <Grid container spacing={3}>
      <KpiSummary stats={stats} />

      <TrendsSection stats={stats} tickets={tickets ?? []} ticketsEnabled={ticketsEnabled} ticketsLoading={ticketsLoading} chartHeight={chartHeight} />

      <SpendingRhythm stats={stats} chartHeight={chartHeight} />

      <BudgetSection
        stats={stats}
        accounts={accounts ?? []}
        accountsLoading={accountsLoading}
        budgetExpenses={budgetExpenses}
        budgetIncomes={budgetIncomes}
        totalsExpenses={totalsExpenses}
        totalsIncomes={totalsIncomes}
        budgetLoading={budgetLoading}
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
