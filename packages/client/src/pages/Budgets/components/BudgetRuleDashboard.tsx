import React from 'react'
import { Grid, Stack, Typography, useTheme } from '@mui/material'
import { MainCard } from 'components'
import { InfoCircleOutlined } from '@ant-design/icons'
import { format } from 'utils'
import { Rule503020Data } from '../hooks/useBudgets'
import BudgetRuleCard from './BudgetRuleCard'

interface BudgetRuleDashboardProps {
  data?: Rule503020Data
}

const BudgetRuleDashboard = ({ data }: BudgetRuleDashboardProps) => {
  const theme = useTheme()

  if (!data) return null

  const { needs, wants, savings } = data

  // Personalized financial recommendations based on real state
  const hasAlerts = needs.percentageReal > 50 || wants.percentageReal > 30 || savings.percentageReal < 20
  const recommendations: string[] = []

  if (needs.percentageReal > 50) {
    recommendations.push(
      `Tus gastos en Necesidades (${format.number(needs.percentageReal)}%) superan el 50% recomendado. Considera revisar tus facturas fijas de suministros, seguros o renegociar contratos recurrentes.`
    )
  }
  if (wants.percentageReal > 30) {
    recommendations.push(
      `Tus gastos en Deseos (${format.number(wants.percentageReal)}%) exceden el 30% aconsejable. Puedes pausar suscripciones no críticas o reducir gastos en ocio y compras discrecionales.`
    )
  }
  if (savings.percentageReal < 20) {
    recommendations.push(
      `Tu tasa de Ahorro Real (${format.number(savings.percentageReal)}%) es menor al 20% objetivo. Intenta automatizar tu ahorro a principio de mes o reajustar los gastos del día a día.`
    )
  }
  if (!hasAlerts) {
    recommendations.push(
      '¡Felicidades! Estás cumpliendo perfectamente con la regla 50/30/20. Tus finanzas están equilibradas y tu nivel de ahorro es saludable. ¡Sigue así!'
    )
  }

  const isFelicidades = !hasAlerts

  return (
    <>
      {/* Needs Card */}
      <BudgetRuleCard
        title='Necesidades'
        subtitle='Gastos fijos y obligatorios'
        budgeted={needs.budgeted}
        real={needs.real}
        percentageBudgeted={needs.percentageBudgeted}
        percentageReal={needs.percentageReal}
        target={50}
      />

      {/* Wants Card */}
      <BudgetRuleCard
        title='Deseos'
        subtitle='Ocio, estilo de vida y caprichos'
        budgeted={wants.budgeted}
        real={wants.real}
        percentageBudgeted={wants.percentageBudgeted}
        percentageReal={wants.percentageReal}
        target={30}
      />

      {/* Savings Card */}
      <BudgetRuleCard
        title='Ahorro / Inversión'
        subtitle='Capacidad neta e inversiones directas'
        budgeted={savings.budgeted}
        real={savings.real}
        percentageBudgeted={savings.percentageBudgeted}
        percentageReal={savings.percentageReal}
        target={20}
        isSavings
      />

      {/* Financial Health Diagnostics Panel */}
      <Grid size={12}>
        <MainCard
          contentSX={{ p: 2.25 }}
          sx={{
            backgroundColor: isFelicidades
              ? theme.palette.success.light + '12' // Translúcido verde
              : theme.palette.warning.light + '12', // Translúcido naranja/amarillo
            border: `1px solid ${
              isFelicidades
                ? theme.palette.success.light + '33'
                : theme.palette.warning.light + '33'
            }`
          }}
        >
          <Stack spacing={1.5}>
            <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
              <InfoCircleOutlined
                style={{
                  color: isFelicidades
                    ? theme.palette.success.main
                    : theme.palette.warning.main,
                  fontSize: '1.25rem'
                }}
              />
              <Typography variant='subtitle1' color='textPrimary' sx={{ fontWeight: 'bold' }}>
                Diagnóstico de Salud Financiera (Regla 50/30/20)
              </Typography>
            </Stack>
            <Stack spacing={1} sx={{ pl: 3.5 }}>
              {recommendations.map((recommendation) => (
                <Typography key={recommendation} variant='body2' color='textSecondary'>
                  • {recommendation}
                </Typography>
              ))}
            </Stack>
          </Stack>
        </MainCard>
      </Grid>
    </>
  )
}

export default BudgetRuleDashboard
