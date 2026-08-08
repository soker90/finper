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
import { useCategories } from 'hooks/useCategories'
import { useStores } from 'hooks/useStores'
import { addCreditCardMovement, editCreditCardMovement } from 'services/apiService'
import type { CreditCardMovement } from 'types'

interface ModalMovementProps {
  open: boolean
  onClose: () => void
  creditCardId: string
  movement?: CreditCardMovement | null
  onSuccess: () => void
}

export const ModalMovement: React.FC<ModalMovementProps> = ({
  open,
  onClose,
  creditCardId,
  movement,
  onSuccess
}) => {
  const { categories, isLoading: loadingCategories } = useCategories()
  const { stores } = useStores()

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState<string>('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [storeId, setStoreId] = useState<string>('')
  const [note, setNote] = useState<string>('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [prevMovement, setPrevMovement] = useState<CreditCardMovement | null | undefined>(undefined)
  const [prevOpen, setPrevOpen] = useState(false)

  if (movement !== prevMovement || open !== prevOpen) {
    setPrevMovement(movement)
    setPrevOpen(open)
    if (movement) {
      setDate(new Date(movement.date).toISOString().split('T')[0])
      setType(movement.type || 'expense')
      setAmount(String(movement.amount))
      setCategoryId(movement.categoryId || '')
      setStoreId(movement.storeId || '')
      setNote(movement.note || '')
    } else {
      setDate(new Date().toISOString().split('T')[0])
      setType('expense')
      setAmount('')
      setCategoryId(categories.length > 0 ? (categories[0].id || categories[0]._id || '') : '')
      setStoreId('')
      setNote('')
    }
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      setError('El importe debe ser mayor a 0')
      return
    }
    if (!categoryId) {
      setError('Selecciona una categoría')
      return
    }

    setSubmitting(true)
    setError(null)

    const dateTimestamp = new Date(date).getTime()
    const payload = {
      date: dateTimestamp,
      amount: parseFloat(amount),
      type,
      categoryId,
      storeId: storeId || null,
      note: note.trim() || null
    }

    const res = movement
      ? await editCreditCardMovement(creditCardId, movement.id || movement._id, payload)
      : await addCreditCardMovement(creditCardId, payload)

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
          {movement ? 'Editar Movimiento de Tarjeta' : 'Nuevo Movimiento con Tarjeta'}
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                type='date'
                fullWidth
                label='Fecha'
                value={date}
                onChange={(e) => setDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label='Tipo'
                value={type}
                onChange={(e) => setType(e.target.value as 'expense' | 'income')}
                required
              >
                <MenuItem value='expense'>Gasto (Aumenta deuda)</MenuItem>
                <MenuItem value='income'>Devolución / Abono (Reduce deuda)</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type='number'
                label='Importe (€)'
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder='Ej. 49.99'
                slotProps={{ htmlInput: { step: '0.01', min: '0.01' } }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label='Categoría'
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={loadingCategories}
                required
              >
                {categories.map((cat) => {
                  const id = cat.id || cat._id
                  return (
                    <MenuItem key={id} value={id}>
                      {cat.name}
                    </MenuItem>
                  )
                })}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label='Comercio / Tienda (Opcional)'
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
              >
                <MenuItem value=''>-- Ninguno --</MenuItem>
                {stores.map((st) => {
                  const id = st.id || st._id
                  return (
                    <MenuItem key={id} value={id}>
                      {st.name}
                    </MenuItem>
                  )
                })}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Nota / Concepto (Opcional)'
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder='Ej. Compra supermercado'
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
            {movement ? 'Guardar Cambios' : 'Añadir Movimiento'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
