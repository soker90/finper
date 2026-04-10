import { Grid, Skeleton, Alert } from '@mui/material'
import { SyncOutlined } from '@ant-design/icons'
import { format } from 'utils'
import { Subscription } from 'types'
import KpiCard from '../Dashboard/components/KpiCard'

const CYCLE_LABEL_MAP: Record<number, string> = {
  1: 'Mensual',
  2: 'Bimensual',
  3: 'Trimestral',
  6: 'Semestral',
  12: 'Anual',
}

/** Devuelve una etiqueta legible para el ciclo (nº de meses). */
export const getCycleLabel = (cycle: number): string =>
  CYCLE_LABEL_MAP[cycle] ?? `Cada ${cycle} ${cycle === 1 ? 'mes' : 'meses'}`

export const calcMonthly = (subs: Subscription[]) =>
  subs.reduce((acc, s) => acc + s.amount / s.cycle, 0)

// --- Summary row ---
type SummaryProps = { subscriptions: Subscription[]; isLoading: boolean }

export const SubscriptionsSummary = ({ subscriptions, isLoading }: SummaryProps) => {
  const monthly = calcMonthly(subscriptions)
  const annual = monthly * 12
  const activeCount = subscriptions.length

  return (
    <Grid container spacing={3} mb={3} mt={1}>
      <Grid size={{ xs: 12, sm: 4 }}>
        <KpiCard
          title='Gasto mensual'
          value={format.euro(monthly)}
          subtitle='Solo suscripciones activas'
          icon={<SyncOutlined />}
          color='primary'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <KpiCard
          title='Gasto anual'
          value={format.euro(annual)}
          subtitle='Proyección a 12 meses'
          icon={<SyncOutlined />}
          color='primary'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <KpiCard
          title='Total suscripciones'
          value={String(activeCount)}
          subtitle='En seguimiento activo'
          icon={<SyncOutlined />}
          color='primary'
        />
      </Grid>
    </Grid>
  )
}

// --- Empty state ---
export const SubscriptionsEmpty = ({ onNew }: { onNew: () => void }) => (
  <Alert severity='info' sx={{ cursor: 'pointer', mt: 1 }} onClick={onNew}>
    No tienes suscripciones todavía. Pulsa "Nueva" para añadir la primera — Finper detectará automáticamente sus pagos.
  </Alert>
)

// --- Loading skeleton ---
export const SubscriptionsSkeleton = ({ count = 4 }: { count?: number }) => (
  <Grid container spacing={2}>
    {[...Array(count)].map((_, i) => (
      <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
        <Skeleton variant='rounded' height={175} />
      </Grid>
    ))}
  </Grid>
)
