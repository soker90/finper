import { useState } from 'react'
import {
  Typography, Box, Alert,
  FormControl, InputLabel, Select, MenuItem, Radio, RadioGroup,
  FormControlLabel, Grid
} from '@mui/material'
import { Dayjs } from 'dayjs'
import useSWR from 'swr'
import ModalGrid from 'components/modals/ModalGrid'
import { format } from 'utils'
import { Yield, YieldEntry, YieldSettlement } from 'types'
import { YIELD_MATCHING_TRANSACTIONS } from 'constants/api-paths'
import { linkYieldTransactions } from 'services/apiService'
import { useYield } from 'hooks/useYields'
import { useCategories } from 'hooks/useCategories'
import { objectToParams } from 'utils/objectToParams'
import { useSubmitError } from '../../hooks/useSubmitError'
import SettlementRateFields from '../SettlementRateFields'
import TransactionFilters from './TransactionFilters'
import TransactionCheckList from './TransactionCheckList'

type Props = {
  item: Yield
  onClose: () => void
  onLinked: () => void
  /** When provided, the modal is pre-fixed to this settlement: no RadioGroup or Select is shown. */
  fixedSettlement?: YieldSettlement
}

const getSettlementLabel = (settlement: YieldSettlement) => {
  const dateLabel = settlement.settlementDate
    ? format.date(settlement.settlementDate)
    : 'Pendiente'
  return `${dateLabel} (${settlement.entries.length} movimientos)`
}

const LinkTransactionsModal = ({ item, onClose, onLinked, fixedSettlement }: Props) => {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const { error: linkError, runSubmit } = useSubmitError()

  // When fixedSettlement is provided, we are implicitly in 'existing' mode
  const [linkMode, setLinkMode] = useState<'new' | 'existing'>(fixedSettlement ? 'existing' : 'new')
  const [targetSettlementId, setTargetSettlementId] = useState<string>(fixedSettlement?.id ?? '')
  const [tae, setTae] = useState<string>('')
  const [averageBalance, setAverageBalance] = useState<string>('')

  // Only fetch existing settlements when no fixed settlement is provided (SWR deduplication handles cache)
  const { yieldData } = useYield(item._id)
  const existingSettlements = (!fixedSettlement && yieldData?.settlements) ? yieldData.settlements : []

  const { categories } = useCategories()
  const yieldCategories = categories.filter((category) => category._id && item.categoryIds.includes(category._id))

  const [categoryFilter, setCategoryFilter] = useState('')
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null)
  const [dateTo, setDateTo] = useState<Dayjs | null>(null)

  // The API only returns the 50 most recent unlinked matches: narrowing by
  // category and/or date range lets older movements (otherwise invisible) be found.
  const { data: transactions, isLoading } = useSWR<YieldEntry[]>(
    `${YIELD_MATCHING_TRANSACTIONS(item._id)}${objectToParams({
      categoryId: categoryFilter || undefined,
      dateFrom: dateFrom ? dateFrom.startOf('day').valueOf() : undefined,
      dateTo: dateTo ? dateTo.endOf('day').valueOf() : undefined
    })}`
  )

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const handleSubmit = async () => {
    if (selected.size === 0) return
    if (linkMode === 'existing' && !targetSettlementId) return

    setSubmitting(true)
    const payload = {
      transactionIds: [...selected],
      settlementId: linkMode === 'existing' ? targetSettlementId : null,
      tae: (linkMode === 'new' && tae) ? parseFloat(tae) : null,
      averageBalance: (linkMode === 'new' && averageBalance) ? parseFloat(averageBalance) : null
    }
    await runSubmit(() => linkYieldTransactions(item._id, payload), () => {
      onLinked()
      onClose()
    })
    setSubmitting(false)
  }

  return (
    <ModalGrid
      show
      title={`Movimientos de ${item.account.name} - ${item.type === 'interest' ? 'Remunerada' : 'Cashback'}`}
      onClose={onClose}
      action={handleSubmit}
      actionDisabled={submitting || selected.size === 0 || (linkMode === 'existing' && !targetSettlementId)}
    >
      <Box sx={{ width: '100%', gridColumn: '1 / -1' }}>
        <Typography variant='caption' color='textSecondary' sx={{ display: 'block', mb: 2 }}>
          Selecciona los movimientos sin enlazar para agruparlos en una liquidación.
        </Typography>

        {/* Link options – hidden when settlement is already fixed from a table row */}
        {!fixedSettlement && (
          <FormControl component='fieldset' fullWidth sx={{ mb: 2 }}>
            <RadioGroup
              row
              value={linkMode}
              onChange={(e) => setLinkMode(e.target.value as 'new' | 'existing')}
            >
              <FormControlLabel value='new' control={<Radio size='small' />} label='Nueva liquidación' />
              {existingSettlements.length > 0 && (
                <FormControlLabel value='existing' control={<Radio size='small' />} label='Añadir a liquidación existente' />
              )}
            </RadioGroup>
          </FormControl>
        )}

        {!fixedSettlement && linkMode === 'new' && item.type === 'interest' && (
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <SettlementRateFields
              tae={tae}
              onTaeChange={setTae}
              averageBalance={averageBalance}
              onAverageBalanceChange={setAverageBalance}
              optional
            />
          </Grid>
        )}

        {/* Settlement selector – hidden when fixedSettlement is provided */}
        {!fixedSettlement && linkMode === 'existing' && (
          <FormControl fullWidth size='small' sx={{ mb: 2 }}>
            <InputLabel id='settlement-select-label'>Seleccionar liquidación</InputLabel>
            <Select
              labelId='settlement-select-label'
              value={targetSettlementId}
              label='Seleccionar liquidación'
              onChange={(e) => setTargetSettlementId(e.target.value as string)}
            >
              {existingSettlements.map((settlement) => (
                <MenuItem key={settlement.id} value={settlement.id}>
                  {getSettlementLabel(settlement)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <TransactionFilters
          categories={yieldCategories}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
        />

        {linkError && (
          <Alert severity='error' sx={{ mt: 1, mb: 1 }}>{linkError}</Alert>
        )}

        <TransactionCheckList
          isLoading={isLoading}
          transactions={transactions}
          selected={selected}
          onToggle={toggle}
          accountName={item.account.name}
          hasActiveFilter={Boolean(categoryFilter || dateFrom || dateTo)}
        />
      </Box>
    </ModalGrid>
  )
}

export default LinkTransactionsModal
