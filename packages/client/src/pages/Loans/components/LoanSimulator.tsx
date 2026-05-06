import { useState, useEffect, type ChangeEvent } from 'react'
import { Box, Card, CardContent, Chip, Slider, Stack, TextField, Typography, CircularProgress, Alert } from '@mui/material'
import { format } from 'utils'
import { useDebouncedValue } from 'hooks/useDebouncedValue'
import { SimulationResult } from 'types'
import { simulateLoanPayoff } from 'services/apiService'

interface Props {
  loanId: string
  monthlyPayment: number
  pendingAmount: number
}

const DEBOUNCE_MS = 400

const formatMonthsDiff = (months: number): string => {
  if (months <= 0) return '0 meses'
  const years = Math.floor(months / 12)
  const remaining = months % 12
  if (years === 0) return `${remaining} mes${remaining !== 1 ? 'es' : ''}`
  if (remaining === 0) return `${years} año${years !== 1 ? 's' : ''}`
  return `${years} año${years !== 1 ? 's' : ''} y ${remaining} mes${remaining !== 1 ? 'es' : ''}`
}

const LoanSimulator = ({ loanId, monthlyPayment, pendingAmount }: Props) => {
  const [lumpSum, setLumpSum] = useState(0)
  const debouncedLumpSum = useDebouncedValue(lumpSum, DEBOUNCE_MS)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const maxAmount = Math.floor(pendingAmount)

  useEffect(() => {
    if (debouncedLumpSum <= 0) {
      setResult(null)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    simulateLoanPayoff(loanId, debouncedLumpSum)
      .then((res) => {
        if (cancelled) return
        if (res.error) {
          setError(res.error)
          setResult(null)
        } else {
          setResult(res.data ?? null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Error al calcular la simulación')
          setResult(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [loanId, debouncedLumpSum])

  const handleSliderChange = (_: Event, value: number | number[]) => {
    setLumpSum(value as number)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === '') {
      setLumpSum(0)
      return
    }
    const val = Math.floor(Number(raw))
    if (!isNaN(val)) {
      setLumpSum(Math.min(Math.max(0, val), maxAmount))
    } else {
      setLumpSum(0)
    }
  }

  return (
    <Card variant='outlined'>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          Simulador de amortización
        </Typography>
        <Typography variant='body2' color='textSecondary' gutterBottom>
          ¿Qué pasa si hago un pago puntual de capital?
        </Typography>

        <Stack spacing={2} mt={2}>
          <Stack direction='row' spacing={2} alignItems='center'>
            <Slider
              value={lumpSum}
              onChange={handleSliderChange}
              min={0}
              max={maxAmount}
              step={1}
              valueLabelDisplay='auto'
              valueLabelFormat={(v) => format.euro(v)}
              sx={{ flex: 1 }}
            />
            <TextField
              type='number'
              value={lumpSum}
              onChange={handleInputChange}
              inputProps={{ min: 0, max: maxAmount, step: 1 }}
              label='Importe'
              size='small'
              sx={{ width: 140 }}
            />
          </Stack>

          {loading && (
            <Box display='flex' justifyContent='center' py={2}>
              <CircularProgress size={24} />
            </Box>
          )}

          {error && <Alert severity='error'>{error}</Alert>}

          {result && !loading && (
            <Stack spacing={2}>
              <Typography variant='body2' color='textSecondary'>
                Pago puntual: {format.euro(result.lumpSum)} — Capital restante: {format.euro(pendingAmount - result.lumpSum)}
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {/* Option A: reduce term */}
                <Card sx={{ flex: 1, bgcolor: 'success.50' }} variant='outlined'>
                  <CardContent>
                    <Stack direction='row' alignItems='center' spacing={1} mb={1}>
                      <Typography variant='subtitle2'>Reducir tiempo</Typography>
                      <Chip label='Misma cuota' size='small' variant='outlined' />
                    </Stack>
                    <Typography variant='h5' color='success.main'>
                      {formatMonthsDiff(result.optionA.monthsSaved)}
                    </Typography>
                    <Typography variant='body2' color='textSecondary'>
                      Fin: {result.optionA.newEndDate ? format.date(result.optionA.newEndDate) : '-'}
                    </Typography>
                    <Typography variant='body2' color='success.dark'>
                      Ahorro: {format.euro(result.optionA.totalInterestSaved)}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Option B: reduce quota */}
                <Card sx={{ flex: 1, bgcolor: 'info.50' }} variant='outlined'>
                  <CardContent>
                    <Stack direction='row' alignItems='center' spacing={1} mb={1}>
                      <Typography variant='subtitle2'>Reducir cuota</Typography>
                      <Chip label='Mismo plazo' size='small' variant='outlined' />
                    </Stack>
                    <Typography variant='h5' color='info.main'>
                      {format.euro(result.optionB.monthlySaving)}/mes
                    </Typography>
                    <Typography variant='body2' color='textSecondary'>
                      {format.euro(result.originalMonthlyPayment)} → {format.euro(result.optionB.newMonthlyPayment)}
                    </Typography>
                    <Typography variant='body2' color='info.dark'>
                      Ahorro: {format.euro(result.optionB.totalInterestSaved)}
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

export default LoanSimulator
