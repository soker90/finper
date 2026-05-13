import { Grid, Grow, Stack } from '@mui/material'
import { type DashboardStats } from 'hooks'
import { type Account, type Budget } from 'types'
import SectionTitle from '../SectionTitle'
import BudgetCard from './BudgetCard'
import AccountsPieChart from './AccountsPieChart'
import PensionCard from './PensionCard'
import { BudgetCardSkeleton, PieChartSkeleton } from '../DashboardStates'
import MainCard from 'components/MainCard'
import { hoverCardSx } from '../shared'

interface BudgetSectionProps {
  stats: DashboardStats
  accounts: Account[]
  accountsLoading: boolean
  budgetExpenses: Budget[]
  budgetIncomes: Budget[]
  totalsExpenses: Budget
  totalsIncomes: Budget
  budgetLoading: boolean
  chartColors: string[]
  isMobile: boolean
}

const BudgetSection = ({
  stats,
  accounts,
  accountsLoading,
  budgetExpenses,
  budgetIncomes,
  totalsExpenses,
  totalsIncomes,
  budgetLoading,
  chartColors,
  isMobile
}: BudgetSectionProps) => (
  <>
    <SectionTitle>Presupuesto y distribución</SectionTitle>

    {budgetLoading
      ? (
        <>
          <BudgetCardSkeleton />
          <BudgetCardSkeleton />
        </>
        )
      : (
        <>
          <BudgetCard
            title='Presupuesto gastos'
            budgetItems={budgetExpenses}
            totals={totalsExpenses}
            emptyMessage='Sin presupuesto de gastos'
            allowOver
            chipColor={(real, estimated) => real > estimated ? 'error' : 'success'}
            growTimeout={1100}
          />

          <BudgetCard
            title='Presupuesto ingresos'
            budgetItems={budgetIncomes}
            totals={totalsIncomes}
            emptyMessage='Sin presupuesto de ingresos'
            chipColor={(real, estimated) => real >= estimated ? 'success' : 'warning'}
            growTimeout={1150}
          />
        </>
        )}

    <Grow in timeout={1200}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Stack spacing={3}>
          {accountsLoading
            ? (
              <MainCard title='Distribución por cuentas' sx={hoverCardSx}>
                <PieChartSkeleton height={isMobile ? 280 : 270} />
              </MainCard>
              )
            : (
              <AccountsPieChart accounts={accounts} chartColors={chartColors} isMobile={isMobile} />
              )}
          <PensionCard pension={stats.pension} pensionReturnPct={stats.pensionReturnPct} />
        </Stack>
      </Grid>
    </Grow>
  </>
)

export default BudgetSection
