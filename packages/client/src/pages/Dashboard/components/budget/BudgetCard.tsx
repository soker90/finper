import { Grid, Grow, Chip } from '@mui/material'
import { format } from 'utils'
import MainCard from 'components/MainCard'
import { type Budget } from 'types'
import BudgetProgressList, { type BudgetRow } from './BudgetProgressList'
import { hoverCardSx } from '../shared'

interface BudgetCardProps {
  title: string
  budgetItems: Budget[]
  totals: Budget
  emptyMessage: string
  allowOver?: boolean
  /** Devuelve el color del chip de totales según real vs estimado */
  chipColor: (real: number, estimated: number) => 'error' | 'warning' | 'success'
  growTimeout: number
}

const toBudgetRows = (items: Budget[], allowOver: boolean): BudgetRow[] =>
  items
    .filter(b => b.budgets?.[0]?.amount > 0)
    .slice(0, 10)
    .map(b => {
      const estimated = b.budgets?.[0]?.amount ?? 0
      const real = b.budgets?.[0]?.real ?? 0
      const pct = estimated > 0 ? Math.min((real / estimated) * 100, 100) : 0
      return { name: b.name, real, estimated, pct, over: allowOver && real > estimated }
    })

const BudgetCard = ({
  title,
  budgetItems,
  totals,
  emptyMessage,
  allowOver = false,
  chipColor,
  growTimeout
}: BudgetCardProps) => {
  const rows = toBudgetRows(budgetItems, allowOver)
  const total = {
    real: totals?.budgets?.[0]?.real ?? 0,
    estimated: totals?.budgets?.[0]?.amount ?? 0
  }

  return (
    <Grow in timeout={growTimeout}>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <MainCard
          title={title}
          sx={{ ...hoverCardSx, height: '100%' }}
          secondary={
            total.estimated > 0
              ? (
                <Chip
                  size='small'
                  label={`${format.euro(total.real)} / ${format.euro(total.estimated)}`}
                  color={chipColor(total.real, total.estimated)}
                />
                )
              : undefined
          }
        >
          <BudgetProgressList rows={rows} emptyMessage={emptyMessage} />
        </MainCard>
      </Grid>
    </Grow>
  )
}

export default BudgetCard
