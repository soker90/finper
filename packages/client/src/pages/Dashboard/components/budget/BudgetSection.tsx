import { Grid, Grow, Stack } from '@mui/material'
import { type DashboardStats } from 'hooks'
import { type Account, type Budget } from 'types'
import SectionTitle from '../SectionTitle'
import BudgetCard from './BudgetCard'
import AccountsPieChart from './AccountsPieChart'
import PensionCard from './PensionCard'

interface BudgetSectionProps {
  stats: DashboardStats
  accounts: Account[]
  budgetExpenses: Budget[]
  budgetIncomes: Budget[]
  totalsExpenses: Budget
  totalsIncomes: Budget
  chartColors: string[]
  isMobile: boolean
}

const BudgetSection = ({
  stats,
  accounts,
  budgetExpenses,
  budgetIncomes,
  totalsExpenses,
  totalsIncomes,
  chartColors,
  isMobile
}: BudgetSectionProps) => (
  <>
    <SectionTitle>Presupuesto y distribución</SectionTitle>

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

    <Grow in timeout={1200}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Stack spacing={3}>
          <AccountsPieChart accounts={accounts} chartColors={chartColors} isMobile={isMobile} />
          <PensionCard pension={stats.pension} pensionReturnPct={stats.pensionReturnPct} />
        </Stack>
      </Grid>
    </Grow>
  </>
)

export default BudgetSection
