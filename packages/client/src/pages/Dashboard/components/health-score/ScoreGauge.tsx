import { useTheme } from '@mui/material/styles'
import { Stack, Box, Typography, LinearProgress } from '@mui/material'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import { type HealthScore } from 'hooks'
import { getScoreColor } from '../../utils/scoreHelpers'

interface ScoreGaugeProps {
  healthScore: HealthScore
}

const SCORE_ITEMS = [
  { label: 'Tasa de ahorro', key: 'savingsRate' },
  { label: 'Ratio deuda', key: 'debtRatio' },
  { label: 'Presupuesto', key: 'budgetAdherence' },
  { label: 'Colchón', key: 'cashRunway' },
  { label: 'Pensión', key: 'pensionReturn' }
] as const

const ScoreGauge = ({ healthScore }: ScoreGaugeProps) => {
  const theme = useTheme()

  const gaugeData = [
    { name: 'Score', value: healthScore.total, fill: theme.palette[getScoreColor(healthScore.total)].main }
  ]

  return (
    <Stack alignItems='center' spacing={1}>
      <Box sx={{ position: 'relative', width: '100%', maxWidth: 200 }}>
        <ResponsiveContainer width='100%' height={180}>
          <RadialBarChart
            cx='50%'
            cy='85%'
            innerRadius='60%'
            outerRadius='100%'
            startAngle={180}
            endAngle={0}
            barSize={16}
            data={gaugeData}
          >
            <RadialBar
              // @ts-ignore - background prop is valid but not typed
              background={{ fill: theme.palette.grey[100] }}
              dataKey='value'
              cornerRadius={8}
              animationDuration={1000}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <Box
          sx={{
            position: 'absolute',
            bottom: '12%',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center'
          }}
        >
          <Typography variant='h3' fontWeight={700} color={`${getScoreColor(healthScore.total)}.main`}>
            {healthScore.total}
          </Typography>
          <Typography variant='caption' color='textSecondary'>de 100</Typography>
        </Box>
      </Box>

      <Stack spacing={0.75} sx={{ width: '100%', pt: 1 }}>
        {SCORE_ITEMS.map(item => (
          <Stack key={item.label} direction='row' alignItems='center' spacing={1}>
            <Typography variant='body2' color='textSecondary' sx={{ minWidth: 100 }}>
              {item.label}
            </Typography>
            <LinearProgress
              variant='determinate'
              value={healthScore[item.key]}
              color={getScoreColor(healthScore[item.key])}
              sx={{ flex: 1, borderRadius: 1, height: 5 }}
            />
            <Typography variant='body2' fontWeight={600} sx={{ minWidth: 28, textAlign: 'right' }}>
              {healthScore[item.key]}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  )
}

export default ScoreGauge
