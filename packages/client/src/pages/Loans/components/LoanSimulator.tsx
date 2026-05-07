import { useState, type ChangeEvent } from 'react'
import { Box, Card, CardContent, Slider, Stack, TextField, Typography, CircularProgress, Alert } from '@mui/material'
import { format } from 'utils'
import { useDebouncedValue } from 'hooks'
import { useLoanSimulation } from '../hooks'
import SimulationOptionCard from './SimulationOptionCard'

interface Props {
  loanId: string
  monthlyPayment: number
  pendingAmount: number
}

const DEBOUNCE_MS = 400

const LoanSimulator = ({ loanId, monthlyPayment, pendingAmount }: Props) => {
  const [lumpSum, setLumpSum] = useState(0)
  const debouncedLumpSum = useDebouncedValue(lumpSum, DEBOUNCE_MS)
  const { result, loading, error } = useLoanSimulation(loanId, debouncedLumpSum)

  const maxAmount = Math.floor(pendingAmount)

  const handleSliderChange = (_sliderEvent: Event, value: number | number[]) => {
    setLumpSum(value as number)
  }

  const handleInputChange = (changeEvent: ChangeEvent<HTMLInputElement>) => {
    const rawInputValue = changeEvent.target.value
    if (rawInputValue === '') {
      setLumpSum(0)
      return
    }
    const parsedValue = Math.floor(Number(rawInputValue))
    if (!isNaN(parsedValue)) {
      setLumpSum(Math.min(Math.max(0, parsedValue), maxAmount))
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
              valueLabelFormat={format.euro}
              aria-label='Importe del pago puntual'
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
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap flexWrap='wrap'>
                <Typography variant='body2' color='textSecondary'>
                  Pago puntual: {format.euro(result.lumpSum)} — Capital restante: {format.euro(pendingAmount - result.lumpSum)}
                </Typography>
                {result.originalEndDate && (
                  <Typography variant='body2' color='textSecondary'>
                    Fin actual: {format.date(result.originalEndDate)}
                  </Typography>
                )}
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <SimulationOptionCard
                  title='Reducir tiempo'
                  chipLabel='Misma cuota'
                  option={result.optionA}
                  variant='reduceTerm'
                />
                <SimulationOptionCard
                  title='Reducir cuota'
                  chipLabel='Mismo plazo'
                  option={result.optionB}
                  variant='reduceQuota'
                  originalMonthlyPayment={result.originalMonthlyPayment}
                />
              </Stack>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

export default LoanSimulator
