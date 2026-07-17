import { Grid, Skeleton, Alert } from '@mui/material'
import { RiseOutlined } from '@ant-design/icons'
import { format } from 'utils'
import { Yield } from 'types'
import KpiCard from '../Dashboard/components/KpiCard'

export const calcTotalNet = (items: Yield[], selectedYear?: number | 'all') =>
  items.reduce((acc, y) => {
    if (selectedYear && selectedYear !== 'all') {
      const found = y.annualBreakdown?.find((a) => a.year === selectedYear)
      return acc + (found?.net ?? 0)
    }
    return acc + y.netAccumulated
  }, 0)

// --- Summary row ---
type SummaryProps = { items: Yield[], selectedYear?: number | 'all' }

export const YieldsSummary = ({ items, selectedYear = 'all' }: SummaryProps) => {
  const totalNet = calcTotalNet(items, selectedYear)
  const totalEntries = items.reduce((acc, y) => acc + y.entriesCount, 0)
  const isAnnual = selectedYear !== 'all'

  return (
    <Grid
      container
      spacing={3}
      sx={{
        mb: 3,
        mt: 2
      }}
    >
      <Grid size={{ xs: 12, sm: 4 }}>
        <KpiCard
          title={isAnnual ? `Neto en ${selectedYear}` : 'Neto acumulado'}
          value={format.euro(totalNet)}
          subtitle={isAnnual ? `Suma de rendimientos en ${selectedYear}` : 'Suma de todos los rendimientos'}
          icon={<RiseOutlined />}
          color='primary'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <KpiCard
          title='Rendimientos'
          value={String(items.length)}
          subtitle='En seguimiento'
          icon={<RiseOutlined />}
          color='primary'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <KpiCard
          title='Movimientos enlazados'
          value={String(totalEntries)}
          subtitle='Abonos, impuestos y recibos'
          icon={<RiseOutlined />}
          color='primary'
        />
      </Grid>
    </Grid>
  )
}

// --- Empty state ---
export const YieldsEmpty = ({ onNew }: { onNew: () => void }) => (
  <Alert severity='info' sx={{ cursor: 'pointer', mt: 1 }} onClick={onNew}>
    Todavía no tienes ningún rendimiento. Pulsa "Nuevo" para crear el primero (p. ej. los
    intereses de una cuenta remunerada, o el cashback de tus recibos) y enlázale sus movimientos.
  </Alert>
)

// --- Loading skeleton ---
export const YieldsSkeleton = ({ count = 4 }: { count?: number }) => (
  <Grid container spacing={2}>
    {[...Array(count)].map((_, i) => (
      <Grid key={`yield-skeleton-${i}`} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
        <Skeleton variant='rounded' height={175} />
      </Grid>
    ))}
  </Grid>
)
