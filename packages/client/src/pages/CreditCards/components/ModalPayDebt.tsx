import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import {
  Alert,
  Box,
  Grid,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Paper,
  Checkbox,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  FormHelperText
} from '@mui/material'
import { BankOutlined } from '@ant-design/icons'
import ModalGrid from 'components/modals/ModalGrid'
import InputForm from 'components/forms/InputForm'
import { format, getId } from 'utils'

import { useCreditCardMovements } from '../hooks/useCreditCards'
import { useSubmitError } from '../hooks/useSubmitError'
import { payCreditCardDebt } from 'services/apiService'
import { netAmount } from '../utils'
import type { CreditCard } from 'types'

type PayMode = 'all' | 'amount' | 'selected'

interface PayDebtFormValues {
  mode: PayMode
  amount: string
  movementIds: string[]
}

interface ModalPayDebtProps {
  open: boolean
  onClose: () => void
  creditCard: CreditCard | null
  onSuccess: () => void
}

const DEFAULT_VALUES: PayDebtFormValues = { mode: 'all', amount: '', movementIds: [] }

export const ModalPayDebt = ({ open, onClose, creditCard, onSuccess }: ModalPayDebtProps) => {
  const cardId = creditCard ? getId(creditCard) : undefined
  const { movements: pendingMovements, isLoading: loadingMovements } = useCreditCardMovements(cardId, 'pending')

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control, watch } = useForm<PayDebtFormValues>({
    defaultValues: DEFAULT_VALUES
  })

  useEffect(() => {
    if (open) reset(DEFAULT_VALUES)
  }, [reset, open, creditCard])

  // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form watch() is safe here; no compiler-incompatible pattern
  const mode = watch('mode')
  const watchedAmount = watch('amount')
  const watchedMovementIds = watch('movementIds')

  const { error: submitError, runSubmit } = useSubmitError()

  if (!creditCard) return null

  const currentDebt = creditCard.currentDebt ?? 0
  const account = creditCard.account

  let totalToPay = 0
  if (mode === 'all') {
    totalToPay = currentDebt
  } else if (mode === 'amount') {
    const parsedAmount = parseFloat(watchedAmount)
    totalToPay = Number.isFinite(parsedAmount) ? parsedAmount : 0
  } else if (mode === 'selected') {
    const selectedSet = new Set(watchedMovementIds)
    totalToPay = pendingMovements
      .filter((movement) => {
        const id = getId(movement)
        return id !== undefined && selectedSet.has(id)
      })
      .reduce((acc, movement) => acc + netAmount(movement), 0)
  }
  totalToPay = Math.max(0, Math.round(totalToPay * 100) / 100)

  const currentBalance = account?.balance ?? 0
  const projectedBalance = Math.round((currentBalance - totalToPay) * 100) / 100

  const handleFormSubmit = handleSubmit((data) => runSubmit(async () => {
    if (!cardId) return { error: 'No se pudo identificar la tarjeta' }
    if (data.mode === 'amount' && totalToPay > currentDebt) {
      return { error: `El importe no puede superar la deuda pendiente (${format.euro(currentDebt)})` }
    }
    const payload = data.mode === 'all'
      ? { all: true }
      : data.mode === 'amount'
        ? { amount: totalToPay }
        : { movementIds: data.movementIds }
    return payCreditCardDebt(cardId, payload)
  }, () => {
    onSuccess()
    onClose()
  }))

  return (
    <ModalGrid
      show={open}
      title={`Pagar deuda - ${creditCard.name}`}
      onClose={onClose}
      action={handleFormSubmit}
      actionDisabled={isSubmitting || totalToPay <= 0}
    >
      <Grid size={{ xs: 12 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 2,
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <BankOutlined style={{ fontSize: 20, color: '#1890ff' }} />
            <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
              Cuenta asociada de cobro: {account?.name || 'N/A'} {account?.bank ? `(${account.bank})` : ''}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant='body2' color='text.secondary'>
              Saldo actual cuenta: <strong>{format.euro(currentBalance)}</strong>
            </Typography>
            <Typography
              variant='body2'
              sx={{ fontWeight: 700, color: projectedBalance < 0 ? 'error.main' : 'success.main' }}
            >
              Nuevo saldo estimado: {format.euro(projectedBalance)}
            </Typography>
          </Box>
        </Paper>

        <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1 }}>
          Modalidad de pago:
        </Typography>

        <Controller
          name='mode'
          control={control}
          render={({ field }) => (
            <RadioGroup {...field}>
              <FormControlLabel
                value='all'
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant='body2' sx={{ fontWeight: 600 }}>
                      Pagar deuda total pendiente ({format.euro(currentDebt)})
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Liquida todos los movimientos pendientes de la tarjeta.
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value='amount'
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant='body2' sx={{ fontWeight: 600 }}>
                      Pagar un importe específico
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Se liquidarán los movimientos más antiguos hasta cubrir la cantidad.
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value='selected'
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant='body2' sx={{ fontWeight: 600 }}>
                      Seleccionar movimientos manualmente
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Elige individualmente los movimientos a abonar.
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          )}
        />

        {mode === 'amount' && (
          <Box sx={{ mt: 2, mb: 1, maxWidth: 260 }}>
            <InputForm
              id='amount'
              label='Importe a pagar (€)'
              type='number'
              size={12}
              placeholder={`Ej. Max ${currentDebt.toFixed(2)}`}
              error={Boolean(errors.amount)}
              errorText={errors.amount?.message || 'El importe debe ser mayor a 0'}
              inputProps={{ step: '0.01', min: '0.01', max: currentDebt }}
              {...register('amount', {
                required: mode === 'amount',
                min: { value: 0.01, message: 'El importe debe ser mayor a 0' },
                max: { value: currentDebt, message: `El importe no puede superar la deuda actual (${format.euro(currentDebt)})` }
              })}
            />
          </Box>
        )}

        {mode === 'selected' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant='body2' sx={{ fontWeight: 600, mb: 1 }}>
              Movimientos pendientes ({pendingMovements.length}):
            </Typography>
            {loadingMovements
              ? <CircularProgress size={24} />
              : pendingMovements.length === 0
                ? (
                  <Typography variant='body2' color='text.secondary'>
                    No hay movimientos pendientes de pago.
                  </Typography>
                  )
                : (
                  <Controller
                    name='movementIds'
                    control={control}
                    render={({ field }) => (
                      <Paper variant='outlined' sx={{ maxHeight: 200, overflow: 'auto' }}>
                        <List dense disablePadding>
                          {pendingMovements.filter((movement) => getId(movement) !== undefined).map((movement) => {
                            const id = getId(movement) as string
                            const isChecked = field.value.includes(id)
                            const toggle = () => field.onChange(
                              isChecked ? field.value.filter((item) => item !== id) : [...field.value, id]
                            )
                            return (
                              <div key={id}>
                                <ListItemButton onClick={toggle}>
                                  <ListItemIcon sx={{ minWidth: 36 }}>
                                    <Checkbox edge='start' checked={isChecked} tabIndex={-1} disableRipple />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={`${movement.category?.name || 'Movimiento'}${movement.note ? ` - ${movement.note}` : ''}`}
                                    secondary={format.dateShort(movement.date)}
                                  />
                                  <Typography
                                    variant='body2'
                                    sx={{ fontWeight: 700, color: movement.type === 'expense' ? 'error.main' : 'success.main' }}
                                  >
                                    {movement.type === 'expense' ? '-' : '+'}{format.euro(movement.amount)}
                                  </Typography>
                                </ListItemButton>
                                <Divider component='li' />
                              </div>
                            )
                          })}
                        </List>
                      </Paper>
                    )}
                  />
                  )}
            {errors.movementIds && (
              <FormHelperText error>Selecciona al menos un movimiento</FormHelperText>
            )}
          </Box>
        )}

        <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
              Total a liquidar:
            </Typography>
            <Typography variant='h5' sx={{ fontWeight: 800 }}>
              {format.euro(totalToPay)}
            </Typography>
          </Box>
        </Box>

        {submitError && (
          <Alert severity='error' sx={{ mt: 2 }}>{submitError}</Alert>
        )}
      </Grid>
    </ModalGrid>
  )
}
