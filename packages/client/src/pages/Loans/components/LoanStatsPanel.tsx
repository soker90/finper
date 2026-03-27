import { Grid, Typography, Divider, Box } from '@mui/material'
import { MainCard } from 'components'
import { format } from 'utils'
import { LoanStats } from 'types'

interface StatItemProps {
  label: string
  value: string
  highlight?: 'positive' | 'negative'
}

const StatItem = ({ label, value, highlight }: StatItemProps) => (
  <Box>
    <Typography variant='caption' color='textSecondary'>{label}</Typography>
    <Typography
      variant='h6'
      color={highlight === 'positive' ? 'success.main' : highlight === 'negative' ? 'error.main' : 'inherit'}
    >
      {value}
    </Typography>
  </Box>
)

interface Props {
  stats: LoanStats
}

const LoanStatsPanel = ({ stats }: Props) => (
  <MainCard title='Resumen del préstamo'>
    <Grid container spacing={2}>
      <Grid size={{ xs: 6, sm: 4, md: 3 }}>
        <StatItem label='Capital pagado' value={format.euro(stats.paidPrincipal)} />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 3 }}>
        <StatItem label='Intereses pagados' value={format.euro(stats.paidInterest)} />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 3 }}>
        <StatItem label='Capital pendiente' value={format.euro(stats.pendingPrincipal)} />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 3 }}>
        <StatItem label='Intereses estimados pendientes' value={format.euro(stats.estimatedPendingInterest)} />
      </Grid>

      <Grid size={12}>
        <Divider />
      </Grid>

      <Grid size={{ xs: 6, sm: 4, md: 3 }}>
        <StatItem label='Coste hasta hoy' value={format.euro(stats.totalCostToDate)} />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 3 }}>
        <StatItem label='Coste total estimado' value={format.euro(stats.estimatedTotalCost)} />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 3 }}>
        <StatItem
          label='Ahorro por amortizaciones'
          value={format.euro(stats.savedByExtraordinary)}
          highlight={stats.savedByExtraordinary > 0 ? 'positive' : stats.savedByExtraordinary < 0 ? 'negative' : undefined}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 3 }}>
        <StatItem
          label='Fecha estimada fin'
          value={stats.estimatedEndDate ? new Date(stats.estimatedEndDate).toLocaleDateString('es-ES') : '-'}
        />
      </Grid>

      <Grid size={12}>
        <Divider />
      </Grid>

      <Grid size={{ xs: 6, sm: 4, md: 3 }}>
        <StatItem label='Cuotas ordinarias' value={`${stats.ordinaryPaymentsCount} (${format.euro(stats.totalOrdinaryAmount)})`} />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 3 }}>
        <StatItem label='Amortizaciones extraordinarias' value={`${stats.extraordinaryPaymentsCount} (${format.euro(stats.totalExtraordinaryAmount)})`} />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 3 }}>
        <StatItem label='Cuota actual' value={format.euro(stats.currentPayment)} />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 3 }}>
        <StatItem label='TIN actual' value={`${stats.currentRate}%`} />
      </Grid>
    </Grid>
  </MainCard>
)

export default LoanStatsPanel
