import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Typography,
  Box,
  Paper,
  Checkbox,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress
} from '@mui/material'
import { CheckCircleOutlined, BankOutlined } from '@ant-design/icons'

import { useCreditCardMovements } from './hooks/useCreditCards'
import { payCreditCardDebt } from 'services/apiService'
import type { CreditCard } from 'types'

interface ModalPayDebtProps {
  open: boolean
  onClose: () => void
  creditCard: CreditCard | null
  onSuccess: () => void
}

export const ModalPayDebt: React.FC<ModalPayDebtProps> = ({
  open,
  onClose,
  creditCard,
  onSuccess
}) => {
  const cardId = creditCard?.id || creditCard?._id
  const { movements: pendingMovements, isLoading: loadingMovements } = useCreditCardMovements(cardId, 'pending')

  const [mode, setMode] = useState<'all' | 'amount' | 'selected'>('all')
  const [customAmount, setCustomAmount] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [prevOpen, setPrevOpen] = useState(false)

  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setMode('all')
      setCustomAmount('')
      setSelectedIds([])
      setError(null)
    }
  }

  if (!creditCard) return null

  const currentDebt = creditCard.currentDebt ?? 0
  const account = creditCard.account

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Calculate total amount to pay based on selected mode
  let totalToPay = 0
  if (mode === 'all') {
    totalToPay = currentDebt
  } else if (mode === 'amount') {
    totalToPay = customAmount ? parseFloat(customAmount) : 0
  } else if (mode === 'selected') {
    const selectedSet = new Set(selectedIds)
    totalToPay = pendingMovements
      .filter((m) => selectedSet.has(m.id || m._id))
      .reduce((acc, m) => acc + (m.type === 'expense' ? m.amount : -m.amount), 0)
  }

  totalToPay = Math.max(0, Math.round(totalToPay * 100) / 100)

  const currentBalance = account?.balance ?? 0
  const projectedBalance = Math.round((currentBalance - totalToPay) * 100) / 100

  const handlePay = async () => {
    if (totalToPay <= 0) {
      setError('El importe a pagar debe ser mayor a 0 €')
      return
    }

    setSubmitting(true)
    setError(null)

    let payload: { movementIds?: string[], amount?: number, all?: boolean } = {}
    if (mode === 'all') {
      payload = { all: true }
    } else if (mode === 'amount') {
      payload = { amount: totalToPay }
    } else {
      payload = { movementIds: selectedIds }
    }

    const res = await payCreditCardDebt(cardId!, payload)
    setSubmitting(false)

    if (res.error) {
      setError(res.error)
    } else {
      onSuccess()
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
        Pagar Deuda - {creditCard.name}
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Typography color='error' variant='body2' sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {/* Associated Bank Account Info Box */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
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
              Saldo actual cuenta: <strong>{currentBalance.toFixed(2)} €</strong>
            </Typography>
            <Typography
              variant='body2'
              sx={{
                fontWeight: 700,
                color: projectedBalance < 0 ? 'error.main' : 'success.main'
              }}
            >
              Nuevo saldo estimado: {projectedBalance.toFixed(2)} €
            </Typography>
          </Box>
        </Paper>

        <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1 }}>
          Modalidad de pago:
        </Typography>

        <RadioGroup value={mode} onChange={(e) => setMode(e.target.value as any)}>
          <FormControlLabel
            value='all'
            control={<Radio />}
            label={
              <Box>
                <Typography variant='body2' sx={{ fontWeight: 600 }}>
                  Pagar deuda total pendiente ({currentDebt.toFixed(2)} €)
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

        {mode === 'amount' && (
          <Box sx={{ mt: 2, mb: 1 }}>
            <TextField
              fullWidth
              type='number'
              label='Importe a pagar (€)'
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder={`Ej. Max ${currentDebt.toFixed(2)}`}
              slotProps={{ htmlInput: { step: '0.01', min: '0.01', max: currentDebt } }}
            />
          </Box>
        )}

        {mode === 'selected' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant='body2' sx={{ fontWeight: 600, mb: 1 }}>
              Movimientos pendientes ({pendingMovements.length}):
            </Typography>
            {loadingMovements
              ? (
                <CircularProgress size={24} />
                )
              : pendingMovements.length === 0
                ? (
                  <Typography variant='body2' color='text.secondary'>
                    No hay movimientos pendientes de pago.
                  </Typography>
                  )
                : (
                  <Paper variant='outlined' sx={{ maxHeight: 200, overflow: 'auto' }}>
                    <List dense disablePadding>
                      {pendingMovements.map((m) => {
                        const id = m.id || m._id
                        const isChecked = selectedIds.includes(id)
                        return (
                          <React.Fragment key={id}>
                            <ListItemButton onClick={() => handleToggleSelect(id)}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <Checkbox edge='start' checked={isChecked} tabIndex={-1} disableRipple />
                              </ListItemIcon>
                              <ListItemText
                                primary={`${m.category?.name || 'Movimiento'}${m.note ? ` - ${m.note}` : ''}`}
                                secondary={new Date(m.date).toLocaleDateString('es-ES')}
                              />
                              <Typography
                                variant='body2'
                                sx={{
                                  fontWeight: 700,
                                  color: m.type === 'expense' ? 'error.main' : 'success.main'
                                }}
                              >
                                {m.type === 'expense' ? '-' : '+'}{m.amount.toFixed(2)} €
                              </Typography>
                            </ListItemButton>

                            <Divider component='li' />
                          </React.Fragment>
                        )
                      })}
                    </List>
                  </Paper>
                  )}
          </Box>
        )}

        {/* Payment Summary Box */}
        <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
              Total a liquidar:
            </Typography>
            <Typography variant='h5' sx={{ fontWeight: 800 }}>
              {totalToPay.toFixed(2)} €
            </Typography>
          </Box>
        </Box>

      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button
          onClick={handlePay}
          variant='contained'
          color='success'
          disabled={submitting || totalToPay <= 0}
          startIcon={submitting ? <CircularProgress size={16} color='inherit' /> : <CheckCircleOutlined />}
        >
          Confirmar Pago ({totalToPay.toFixed(2)} €)
        </Button>
      </DialogActions>
    </Dialog>
  )
}
