import React, { useState } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Typography,
  CircularProgress
} from '@mui/material'
import { useAccounts } from 'hooks/useAccounts'
import { addCreditCard, editCreditCard } from 'services/apiService'
import type { CreditCard } from 'types'

interface ModalCreditCardProps {
  open: boolean
  onClose: () => void
  creditCard?: CreditCard | null
  onSuccess: () => void
}

export const ModalCreditCard: React.FC<ModalCreditCardProps> = ({
  open,
  onClose,
  creditCard,
  onSuccess
}) => {
  const { accounts, isLoading: loadingAccounts } = useAccounts()
  const [name, setName] = useState('')
  const [accountId, setAccountId] = useState('')
  const [limit, setLimit] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [prevCard, setPrevCard] = useState<CreditCard | null | undefined>(undefined)
  const [prevOpen, setPrevOpen] = useState(false)

  if (creditCard !== prevCard || open !== prevOpen) {
    setPrevCard(creditCard)
    setPrevOpen(open)
    if (creditCard) {
      setName(creditCard.name || '')
      setAccountId(creditCard.accountId || '')
      setLimit(creditCard.limit !== undefined && creditCard.limit !== null ? String(creditCard.limit) : '')
    } else {
      setName('')
      setAccountId(accounts.length > 0 ? (accounts[0].id || accounts[0]._id || '') : '')
      setLimit('')
    }
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('El nombre de la tarjeta es obligatorio')
      return
    }
    if (!accountId) {
      setError('Debes seleccionar una cuenta asociada')
      return
    }

    setSubmitting(true)
    setError(null)

    const payload = {
      name: name.trim(),
      accountId,
      limit: limit.trim() ? parseFloat(limit) : null
    }

    const res = creditCard
      ? await editCreditCard(creditCard.id || creditCard._id, payload)
      : await addCreditCard(payload)

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
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
          {creditCard ? 'Editar Tarjeta de Crédito' : 'Nueva Tarjeta de Crédito'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            {error && (
              <Grid size={12}>
                <Typography color='error' variant='body2'>
                  {error}
                </Typography>
              </Grid>
            )}
            <Grid size={12}>
              <TextField
                fullWidth
                label='Nombre de la tarjeta'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Ej. Visa Pass, Tarjeta Oro'
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label='Cuenta asociada para el cobro'
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                disabled={loadingAccounts}
                required
              >
                {accounts.map((acc) => {
                  const id = acc.id || acc._id
                  return (
                    <MenuItem key={id} value={id}>
                      {acc.name} ({acc.bank})
                    </MenuItem>
                  )
                })}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type='number'
                label='Límite de crédito (€)'
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder='Ej. 1500 (Opcional)'
                slotProps={{ htmlInput: { step: '0.01', min: '0' } }}
              />
            </Grid>
          </Grid>

        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color='inherit' /> : null}
          >
            {creditCard ? 'Guardar Cambios' : 'Crear Tarjeta'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
