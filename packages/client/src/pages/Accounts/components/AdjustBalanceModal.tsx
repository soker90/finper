import { useState, type FC } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Stack,
  Alert,
  InputAdornment
} from '@mui/material'
import { mutate } from 'swr'
import { Account } from 'types'
import { format } from 'utils'
import { adjustAccountBalance } from 'services/apiService'
import { ACCOUNTS, DASHBOARD_STATS } from 'constants/api-paths'

interface AdjustBalanceModalProps {
  open: boolean
  onClose: () => void
  account: Account
}

const AdjustBalanceModal: FC<AdjustBalanceModalProps> = ({ open, onClose, account }) => {
  const [value, setValue] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    setValue('')
    setError(null)
    onClose()
  }

  const handleSubmit = async () => {
    const realBalance = parseFloat(value.replace(',', '.'))
    if (isNaN(realBalance)) {
      setError('Introduce un importe válido.')
      return
    }

    const diff = Math.round((realBalance - account.balance) * 100) / 100
    if (diff === 0) {
      setError('El importe introducido coincide con el saldo actual. No hay diferencia.')
      return
    }

    setLoading(true)
    setError(null)

    const { error: apiError } = await adjustAccountBalance(account._id!, realBalance)

    if (apiError) {
      setError(apiError)
      setLoading(false)
      return
    }

    // Revalidate accounts list and dashboard stats
    await Promise.all([mutate(ACCOUNTS), mutate(DASHBOARD_STATS)])
    setLoading(false)
    handleClose()
  }

  const parsedValue = parseFloat(value.replace(',', '.'))
  const diff = !isNaN(parsedValue) ? Math.round((parsedValue - account.balance) * 100) / 100 : null

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='xs' fullWidth>
      <DialogTitle>Ajustar saldo — {account.name}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Stack direction='row' justifyContent='space-between'>
            <Typography variant='body2' color='textSecondary'>Saldo registrado</Typography>
            <Typography variant='body2' fontWeight={600}>
              {format.euro(account.balance)}
            </Typography>
          </Stack>

          <TextField
            label='¿Cuánto dinero hay realmente en esta cuenta?'
            type='number'
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setError(null)
            }}
            slotProps={{
              input: {
                endAdornment: <InputAdornment position='end'>€</InputAdornment>
              }
            }}
            inputProps={{ step: '0.01' }}
            fullWidth
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />

          {diff !== null && diff !== 0 && (
            <Alert severity={diff > 0 ? 'success' : 'warning'} variant='outlined'>
              Se registrará una transacción de ajuste por{' '}
              <strong>{diff > 0 ? '+' : ''}{format.euro(diff)}</strong> en la categoría
              &ldquo;Ajuste de Descuadre&rdquo;.
            </Alert>
          )}

          {error && (
            <Alert severity='error' variant='outlined'>{error}</Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={loading || value === ''}
          loading={loading}
        >
          Confirmar ajuste
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AdjustBalanceModal
