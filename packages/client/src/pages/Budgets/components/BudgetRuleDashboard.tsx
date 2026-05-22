import { Box, Grid, Stack, Typography, LinearProgress, useTheme } from '@mui/material'
import { MainCard } from 'components'
import { InfoCircleOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons'
import { format } from 'utils'
import { Rule503020Data } from '../hooks/useBudgets'

interface BudgetRuleDashboardProps {
  data?: Rule503020Data
}

const BudgetRuleDashboard = ({ data }: BudgetRuleDashboardProps) => {
  const theme = useTheme()

  if (!data) return null

  const { needs, wants, savings } = data

  // Configuración de rangos y alertas para cada grupo
  const getNeedsColor = (percentage: number) => {
    if (percentage <= 50) return theme.palette.success.main
    if (percentage <= 55) return theme.palette.warning.main
    return theme.palette.error.main
  }

  const getWantsColor = (percentage: number) => {
    if (percentage <= 30) return theme.palette.success.main
    return theme.palette.error.main
  }

  const getSavingsColor = (percentage: number) => {
    if (percentage >= 20) return theme.palette.success.main
    if (percentage >= 10) return theme.palette.warning.main
    return theme.palette.error.main
  }

  const getStatusIcon = (percentage: number, target: number, isSavings: boolean = false) => {
    if (isSavings) {
      if (percentage >= target) {
        return <CheckCircleOutlined style={{ color: theme.palette.success.main, fontSize: '1.25rem' }} />
      }
      return <WarningOutlined style={{ color: theme.palette.error.main, fontSize: '1.25rem' }} />
    }
    if (percentage <= target) {
      return <CheckCircleOutlined style={{ color: theme.palette.success.main, fontSize: '1.25rem' }} />
    }
    if (percentage <= target + 5) {
      return <WarningOutlined style={{ color: theme.palette.warning.main, fontSize: '1.25rem' }} />
    }
    return <WarningOutlined style={{ color: theme.palette.error.main, fontSize: '1.25rem' }} />
  }

  // Recomendaciones personalizadas basadas en el estado real
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
  if (recommendations.length === 0) {
    recommendations.push(
      '¡Felicidades! Estás cumpliendo perfectamente con la regla 50/30/20. Tus finanzas están equilibradas y tu nivel de ahorro es saludable. ¡Sigue así!'
    )
  }

  return (
    <>
      {/* Tarjeta de Necesidades (50%) */}
      <Grid size={{ xs: 12, md: 4 }}>
        <MainCard contentSX={{ p: 2.25 }} sx={{ height: '100%' }}>
          <Stack spacing={2}>
            <Stack direction='row' sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack spacing={0.25}>
                <Typography variant='h6' color='textSecondary' sx={{ fontWeight: 'bold' }}>
                  Necesidades (50% Obj.)
                </Typography>
                <Typography variant='caption' color='textSecondary'>
                  Gastos fijos y obligatorios
                </Typography>
              </Stack>
              {getStatusIcon(needs.percentageReal, 50)}
            </Stack>

            <Box>
              <Stack direction='row' sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant='caption' color='textSecondary'>Presupuestado</Typography>
                <Typography variant='caption' sx={{ fontWeight: 'bold' }}>
                  {format.euro(needs.budgeted)} ({format.number(needs.percentageBudgeted)}%)
                </Typography>
              </Stack>
              <LinearProgress
                variant='determinate'
                value={Math.min(needs.percentageBudgeted * 2, 100)}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: theme.palette.action.hover,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: theme.palette.primary.light
                  }
                }}
              />
            </Box>

            <Box>
              <Stack direction='row' sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant='caption' color='textSecondary'>Gasto Real</Typography>
                <Typography variant='caption' sx={{ fontWeight: 'bold', color: getNeedsColor(needs.percentageReal) }}>
                  {format.euro(needs.real)} ({format.number(needs.percentageReal)}%)
                </Typography>
              </Stack>
              <LinearProgress
                variant='determinate'
                value={Math.min(needs.percentageReal * 2, 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.palette.action.hover,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getNeedsColor(needs.percentageReal),
                    backgroundImage: `linear-gradient(90deg, ${getNeedsColor(needs.percentageReal)} 0%, ${theme.palette.action.active} 150%)`
                  }
                }}
              />
            </Box>
          </Stack>
        </MainCard>
      </Grid>

      {/* Tarjeta de Deseos (30%) */}
      <Grid size={{ xs: 12, md: 4 }}>
        <MainCard contentSX={{ p: 2.25 }} sx={{ height: '100%' }}>
          <Stack spacing={2}>
            <Stack direction='row' sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack spacing={0.25}>
                <Typography variant='h6' color='textSecondary' sx={{ fontWeight: 'bold' }}>
                  Deseos (30% Obj.)
                </Typography>
                <Typography variant='caption' color='textSecondary'>
                  Ocio, estilo de vida y caprichos
                </Typography>
              </Stack>
              {getStatusIcon(wants.percentageReal, 30)}
            </Stack>

            <Box>
              <Stack direction='row' sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant='caption' color='textSecondary'>Presupuestado</Typography>
                <Typography variant='caption' sx={{ fontWeight: 'bold' }}>
                  {format.euro(wants.budgeted)} ({format.number(wants.percentageBudgeted)}%)
                </Typography>
              </Stack>
              <LinearProgress
                variant='determinate'
                value={Math.min(wants.percentageBudgeted * 3.33, 100)}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: theme.palette.action.hover,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: theme.palette.primary.light
                  }
                }}
              />
            </Box>

            <Box>
              <Stack direction='row' sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant='caption' color='textSecondary'>Gasto Real</Typography>
                <Typography variant='caption' sx={{ fontWeight: 'bold', color: getWantsColor(wants.percentageReal) }}>
                  {format.euro(wants.real)} ({format.number(wants.percentageReal)}%)
                </Typography>
              </Stack>
              <LinearProgress
                variant='determinate'
                value={Math.min(wants.percentageReal * 3.33, 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.palette.action.hover,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getWantsColor(wants.percentageReal),
                    backgroundImage: `linear-gradient(90deg, ${getWantsColor(wants.percentageReal)} 0%, ${theme.palette.action.active} 150%)`
                  }
                }}
              />
            </Box>
          </Stack>
        </MainCard>
      </Grid>

      {/* Tarjeta de Ahorro/Inversión (20%) */}
      <Grid size={{ xs: 12, md: 4 }}>
        <MainCard contentSX={{ p: 2.25 }} sx={{ height: '100%' }}>
          <Stack spacing={2}>
            <Stack direction='row' sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack spacing={0.25}>
                <Typography variant='h6' color='textSecondary' sx={{ fontWeight: 'bold' }}>
                  Ahorro / Inversión (20% Obj.)
                </Typography>
                <Typography variant='caption' color='textSecondary'>
                  Capacidad neta e inversiones directas
                </Typography>
              </Stack>
              {getStatusIcon(savings.percentageReal, 20, true)}
            </Stack>

            <Box>
              <Stack direction='row' sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant='caption' color='textSecondary'>Presupuestado</Typography>
                <Typography variant='caption' sx={{ fontWeight: 'bold' }}>
                  {format.euro(savings.budgeted)} ({format.number(savings.percentageBudgeted)}%)
                </Typography>
              </Stack>
              <LinearProgress
                variant='determinate'
                value={Math.min(savings.percentageBudgeted * 5, 100)}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: theme.palette.action.hover,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: theme.palette.primary.light
                  }
                }}
              />
            </Box>

            <Box>
              <Stack direction='row' sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant='caption' color='textSecondary'>Ahorro Real</Typography>
                <Typography variant='caption' sx={{ fontWeight: 'bold', color: getSavingsColor(savings.percentageReal) }}>
                  {format.euro(savings.real)} ({format.number(savings.percentageReal)}%)
                </Typography>
              </Stack>
              <LinearProgress
                variant='determinate'
                value={Math.min(savings.percentageReal * 5, 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.palette.action.hover,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getSavingsColor(savings.percentageReal),
                    backgroundImage: `linear-gradient(90deg, ${getSavingsColor(savings.percentageReal)} 0%, ${theme.palette.action.active} 150%)`
                  }
                }}
              />
            </Box>
          </Stack>
        </MainCard>
      </Grid>

      {/* Panel de Salud Financiera y Recomendaciones */}
      <Grid size={12}>
        <MainCard
          contentSX={{ p: 2.25 }}
          sx={{
            backgroundColor: recommendations.length === 1 && recommendations[0].startsWith('¡Felicidades!')
              ? theme.palette.success.light + '12' // Color verde translúcido
              : theme.palette.warning.light + '12', // Color naranja translúcido
            border: `1px solid ${
              recommendations.length === 1 && recommendations[0].startsWith('¡Felicidades!')
                ? theme.palette.success.light + '33'
                : theme.palette.warning.light + '33'
            }`
          }}
        >
          <Stack spacing={1.5}>
            <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
              <InfoCircleOutlined
                style={{
                  color: recommendations.length === 1 && recommendations[0].startsWith('¡Felicidades!')
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
              {recommendations.map((recommendation, index) => (
                <Typography key={index} variant='body2' color='textSecondary'>
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
