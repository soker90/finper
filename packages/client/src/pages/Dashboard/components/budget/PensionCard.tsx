import React from 'react'
import { useTheme } from '@mui/material/styles'
import { Stack, Box, Typography, Chip, Divider } from '@mui/material'
import { PieChartOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons'
import {
  AreaChart, Area, Tooltip, ResponsiveContainer
} from 'recharts'
import { format } from 'utils'
import MainCard from 'components/MainCard'
import { type PensionSummary } from 'hooks'
import { hoverCardSx } from '../shared'

interface PensionCardProps {
  pension: PensionSummary | null
  pensionReturnPct: number
}

const PensionSparklineTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <Box sx={{ bgcolor: 'background.paper', p: 1, borderRadius: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <Typography variant='caption' color='textSecondary'>{item.payload.date}</Typography>
      <Typography variant='body2' fontWeight={600}>{format.euro(Number(item.value))}</Typography>
    </Box>
  )
}

const PensionCard = ({ pension, pensionReturnPct }: PensionCardProps) => {
  const theme = useTheme()

  const sparkline = (pension?.transactions ?? [])
    .slice()
    .sort((a, b) => a.date - b.date)
    .slice(-12)
    .map(t => ({
      date: new Date(t.date).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
      value: t.value * (t.employeeUnits + t.companyUnits)
    }))

  return (
    <MainCard
      title='Pensión'
      sx={hoverCardSx}
      secondary={<PieChartOutlined style={{ fontSize: 16, color: theme.palette.primary.main }} />}
    >
      {pension
        ? (
          <Stack spacing={1.5}>
            <Stack direction='row' justifyContent='space-between'>
              <Typography variant='body1' color='textSecondary'>Valor total</Typography>
              <Typography variant='subtitle1'>{format.euro(pension.total)}</Typography>
            </Stack>
            <Divider />
            <Stack direction='row' justifyContent='space-between'>
              <Typography variant='body1' color='textSecondary'>Aporte empleado</Typography>
              <Typography variant='body1'>{format.euro(pension.employeeAmount)}</Typography>
            </Stack>
            <Stack direction='row' justifyContent='space-between'>
              <Typography variant='body1' color='textSecondary'>Aporte empresa</Typography>
              <Typography variant='body1'>{format.euro(pension.companyAmount)}</Typography>
            </Stack>
            <Divider />
            <Stack direction='row' justifyContent='space-between' alignItems='center'>
              <Typography variant='body1' color='textSecondary'>Rentabilidad</Typography>
              <Chip
                size='small'
                icon={pensionReturnPct >= 0
                  ? <RiseOutlined style={{ fontSize: '0.75rem' }} />
                  : <FallOutlined style={{ fontSize: '0.75rem' }} />}
                label={`${pensionReturnPct >= 0 ? '+' : ''}${pensionReturnPct.toFixed(2)}%`}
                color={pensionReturnPct >= 0 ? 'success' : 'error'}
              />
            </Stack>
            {sparkline.length > 1 && (
              <>
                <Divider />
                <Box sx={{ mt: 1 }}>
                  <Typography variant='body2' color='textSecondary' sx={{ mb: 0.5 }}>
                    Evolución (últimos {sparkline.length} aportes)
                  </Typography>
                  <ResponsiveContainer width='100%' height={60}>
                    <AreaChart data={sparkline}>
                      <Area
                        type='monotone'
                        dataKey='value'
                        stroke={theme.palette.primary.main}
                        fill={theme.palette.primary.light}
                        fillOpacity={0.2}
                        strokeWidth={1.5}
                        dot={false}
                        animationDuration={800}
                      />
                      <Tooltip content={<PensionSparklineTooltip />} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </>
            )}
          </Stack>
          )
        : (
          <Typography variant='body1' color='textSecondary'>Sin datos de pensión</Typography>
          )}
    </MainCard>
  )
}

export default PensionCard
