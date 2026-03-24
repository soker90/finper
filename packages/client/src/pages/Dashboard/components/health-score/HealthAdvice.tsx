import React from 'react'
import { Stack, Alert } from '@mui/material'
import { type HealthScore } from 'hooks'

interface HealthAdviceProps {
  healthScore: HealthScore
  hasPension: boolean
}

const HealthAdvice = ({ healthScore, hasPension }: HealthAdviceProps) => (
  <Stack spacing={2}>
    {healthScore.savingsRate < 50 && (
      <Alert severity='warning' variant='outlined'>
        Tu tasa de ahorro está por debajo del 10%. Intenta reducir gastos no esenciales.
      </Alert>
    )}
    {healthScore.debtRatio < 80 && (
      <Alert severity='info' variant='outlined'>
        Tu nivel de deuda es significativo respecto a tus activos. Prioriza reducir deudas.
      </Alert>
    )}
    {healthScore.cashRunway < 50 && (
      <Alert severity='warning' variant='outlined'>
        Tu colchón financiero cubre menos de 3 meses. Considera crear un fondo de emergencia.
      </Alert>
    )}
    {healthScore.budgetAdherence < 60 && (
      <Alert severity='error' variant='outlined'>
        Estás por encima del presupuesto. Revisa tus categorías de gasto.
      </Alert>
    )}
    {healthScore.total >= 70 && (
      <Alert severity='success' variant='outlined'>
        Tu salud financiera es buena. Mantén tus hábitos actuales.
      </Alert>
    )}
    {healthScore.pensionReturn < 30 && hasPension && (
      <Alert severity='info' variant='outlined'>
        La rentabilidad de tu pensión es baja. Revisa las opciones de tu plan.
      </Alert>
    )}
  </Stack>
)

export default HealthAdvice
