import React, { useState } from 'react'
import {
  Typography, Box, Checkbox, List, ListItem,
  ListItemText, ListItemIcon, CircularProgress, Alert,
  FormControl, InputLabel, Select, MenuItem, Radio, RadioGroup,
  FormControlLabel, Grid
} from '@mui/material'
import InputForm from 'components/forms/InputForm'
import { SearchOutlined } from '@ant-design/icons'
import useSWR from 'swr'
import ModalGrid from 'components/modals/ModalGrid'
import { format } from 'utils'
import { Yield, YieldEntry, YieldSettlement } from 'types'
import { YIELDS } from 'constants/api-paths'
import { linkYieldTransactions } from 'services/apiService'
import { useYield } from 'hooks/useYields'

type Props = {
  item: Yield
  onClose: () => void
  onLinked: () => void
  /** When provided, the modal is pre-fixed to this settlement: no RadioGroup or Select is shown. */
  fixedSettlement?: YieldSettlement
}

const LinkTransactionsModal = ({ item, onClose, onLinked, fixedSettlement }: Props) => {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

  // When fixedSettlement is provided, we are implicitly in 'existing' mode
  const [linkMode, setLinkMode] = useState<'new' | 'existing'>(fixedSettlement ? 'existing' : 'new')
  const [targetSettlementId, setTargetSettlementId] = useState<string>(fixedSettlement?.id ?? '')
  const [tae, setTae] = useState<string>('')
  const [averageBalance, setAverageBalance] = useState<string>('')

  // Only fetch existing settlements when no fixed settlement is provided (SWR deduplication handles cache)
  const { yieldData } = useYield(item._id)
  const existingSettlements = (!fixedSettlement && yieldData?.settlements) ? yieldData.settlements : []

  const { data: transactions, isLoading } = useSWR<YieldEntry[]>(
    `${YIELDS}/${item._id}/matching-transactions`
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
    setLinkError(null)

    const payload = {
      transactionIds: [...selected],
      settlementId: linkMode === 'existing' ? targetSettlementId : null,
      tae: (linkMode === 'new' && tae) ? parseFloat(tae) : null,
      averageBalance: (linkMode === 'new' && averageBalance) ? parseFloat(averageBalance) : null
    }

    const result = await linkYieldTransactions(item._id, payload)
    setSubmitting(false)
    if (result.error) {
      setLinkError(result.error)
      return
    }
    onLinked()
    onClose()
  }

  const getSettlementLabel = (settlement: YieldSettlement) => {
    const dateLabel = settlement.settlementDate
      ? format.date(settlement.settlementDate)
      : 'Pendiente'
    return `${dateLabel} (${settlement.entries.length} movimientos)`
  }

  return (
    <ModalGrid
      show
      title={`Movimientos de ${item.name}`}
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
            <InputForm
              id='tae'
              label='TAE (%) (Opcional)'
              type='number'
              value={tae}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTae(e.target.value)}
              inputProps={{ step: 'any' }}
              size={6}
              error={false}
              errorText=''
            />
            <InputForm
              id='averageBalance'
              label='Saldo Medio (€) (Opcional)'
              type='number'
              value={averageBalance}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAverageBalance(e.target.value)}
              inputProps={{ step: 'any' }}
              size={6}
              error={false}
              errorText=''
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

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {!isLoading && (!transactions || transactions.length === 0) && (
          <Alert severity='info' icon={<SearchOutlined />}>
            No hay movimientos candidatos sin enlazar para la cuenta {item.account.name}.
          </Alert>
        )}

        {linkError && (
          <Alert severity='error' sx={{ mt: 1, mb: 1 }}>{linkError}</Alert>
        )}

        {!isLoading && transactions && transactions.length > 0 && (
          <>
            <Typography variant='caption' color='textSecondary' sx={{ display: 'block', mb: 1 }}>
              {transactions.length} movimiento{transactions.length > 1 ? 's' : ''} encontrado{transactions.length > 1 ? 's' : ''} · cuenta {item.account.name}
            </Typography>
            <Box sx={{ maxHeight: 280, overflowY: 'auto', pr: 0.5 }}>
              <List dense disablePadding>
                {transactions.map((tx) => {
                  const checked = selected.has(tx._id)
                  return (
                    <ListItem
                      key={tx._id}
                      disablePadding
                      onClick={() => toggle(tx._id)}
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 1,
                        mb: 0.5,
                        px: 1,
                        bgcolor: checked ? 'primary.lighter' : 'transparent',
                        border: '1px solid',
                        borderColor: checked ? 'primary.light' : 'divider',
                        transition: 'all 0.15s'
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Checkbox checked={checked} size='small' color='primary' tabIndex={-1} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant='body2' sx={{ fontWeight: checked ? 600 : 400 }}>
                              {format.date(tx.date)} · {tx.note || 'Sin nota'}
                            </Typography>
                            <Typography variant='body2' sx={{ fontWeight: 600, color: checked ? 'primary.main' : 'inherit' }}>
                              {format.euro(tx.amount)}
                            </Typography>
                          </Box>
                         }
                        secondary={
                          <Typography variant='caption' color='textSecondary'>
                            Categoría: {tx.category?.name} · {tx.type === 'income' ? 'Ingreso' : 'Gasto'}
                          </Typography>
                         }
                      />
                    </ListItem>
                  )
                })}
              </List>
            </Box>
          </>
        )}
      </Box>
    </ModalGrid>
  )
}

export default LinkTransactionsModal
