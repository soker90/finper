import React from 'react'
import { Box, Grid, Stack, Typography, LinearProgress, useTheme } from '@mui/material'
import { MainCard } from 'components'
import { CheckCircleOutlined, WarningOutlined } from '@ant-design/icons'
import { format } from 'utils'

export interface BudgetRuleCardProps {
  title: string
  subtitle: string
  budgeted: number
  real: number
  percentageBudgeted: number
  percentageReal: number
  target: number
  isSavings?: boolean
}

const BudgetRuleCard = ({
  title,
  subtitle,
  budgeted,
  real,
  percentageBudgeted,
  percentageReal,
  target,
  isSavings = false
}: BudgetRuleCardProps) => {
  const theme = useTheme()
  const progressMultiplier = 100 / target

  // Color logic according to target limits
  const getRuleColor = () => {
    if (isSavings) {
      if (percentageReal >= 20) return theme.palette.success.main
      if (percentageReal >= 10) return theme.palette.warning.main
      return theme.palette.error.main
    }
    if (target === 50) {
      if (percentageReal <= 50) return theme.palette.success.main
      if (percentageReal <= 55) return theme.palette.warning.main
      return theme.palette.error.main
    }
    // target === 30 (Wants)
    if (percentageReal <= 30) return theme.palette.success.main
    return theme.palette.error.main
  }

  const ruleColor = getRuleColor()

  // Status icon logic
  const getStatusIcon = () => {
    if (isSavings) {
      if (percentageReal >= target) {
        return <CheckCircleOutlined style={{ color: theme.palette.success.main, fontSize: '1.25rem' }} />
      }
      return <WarningOutlined style={{ color: theme.palette.error.main, fontSize: '1.25rem' }} />
    }
    if (percentageReal <= target) {
      return <CheckCircleOutlined style={{ color: theme.palette.success.main, fontSize: '1.25rem' }} />
    }
    if (percentageReal <= target + 5) {
      return <WarningOutlined style={{ color: theme.palette.warning.main, fontSize: '1.25rem' }} />
    }
    return <WarningOutlined style={{ color: theme.palette.error.main, fontSize: '1.25rem' }} />
  }

  return (
    <Grid size={{ xs: 12, md: 4 }}>
      <MainCard contentSX={{ p: 2.25 }} sx={{ height: '100%' }}>
        <Stack spacing={2}>
          <Stack direction='row' sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack spacing={0.25}>
              <Typography variant='h6' color='textSecondary' sx={{ fontWeight: 'bold' }}>
                {title} ({target}% Obj.)
              </Typography>
              <Typography variant='caption' color='textSecondary'>
                {subtitle}
              </Typography>
            </Stack>
            {getStatusIcon()}
          </Stack>

          <Box>
            <Stack direction='row' sx={{ justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant='caption' color='textSecondary'>Presupuestado</Typography>
              <Typography variant='caption' sx={{ fontWeight: 'bold' }}>
                {format.euro(budgeted)} ({format.number(percentageBudgeted)}%)
              </Typography>
            </Stack>
            <LinearProgress
              variant='determinate'
              value={Math.min(percentageBudgeted * progressMultiplier, 100)}
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
              <Typography variant='caption' color='textSecondary'>
                {isSavings ? 'Ahorro Real' : 'Gasto Real'}
              </Typography>
              <Typography variant='caption' sx={{ fontWeight: 'bold', color: ruleColor }}>
                {format.euro(real)} ({format.number(percentageReal)}%)
              </Typography>
            </Stack>
            <LinearProgress
              variant='determinate'
              value={Math.min(percentageReal * progressMultiplier, 100)}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.palette.action.hover,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: ruleColor,
                  backgroundImage: `linear-gradient(90deg, ${ruleColor} 0%, ${theme.palette.action.active} 150%)`
                }
              }}
            />
          </Box>
        </Stack>
      </MainCard>
    </Grid>
  )
}

export default BudgetRuleCard
