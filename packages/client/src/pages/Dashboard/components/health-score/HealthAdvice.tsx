import { Stack, Alert, Typography } from '@mui/material'
import { type Insight } from 'hooks'

const SEVERITY_MAP: Record<Insight['type'], 'error' | 'warning' | 'info' | 'success'> = {
  critical: 'error',
  warning: 'warning',
  info: 'info',
  success: 'success'
}

interface HealthAdviceProps {
  insights: Insight[]
}

const HealthAdvice = ({ insights }: HealthAdviceProps) => {
  if (insights.length === 0) {
    return (
      <Typography
        variant='body2' sx={{
          color: 'text.secondary'
        }}
      >No hay consejos disponibles en este momento.
      </Typography>
    )
  }

  return (
    <Stack spacing={2}>
      {insights.map((insight) => (
        <Alert key={`${insight.type}-${insight.title}`} severity={SEVERITY_MAP[insight.type]} variant='outlined'>
          <strong>{insight.title}</strong>{' '}— {insight.message}
        </Alert>
      ))}
    </Stack>
  )
}

export default HealthAdvice
