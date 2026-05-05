import { Box, LinearProgress, Stack, Typography } from '@mui/material'
import { useGoals, useAccounts } from 'hooks'
import { MainCard } from 'components'
import { format } from 'utils'
import GoalIcon from '../../../Goals/components/GoalItem/GoalIcon'

const GoalsWidget = () => {
  const { goals, isLoading } = useGoals()
  const { accounts } = useAccounts()

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
  const totalAllocated = goals.reduce((sum, g) => sum + g.currentAmount, 0)
  const unallocated = Math.max(0, totalBalance - totalAllocated)

  if (isLoading || goals.length === 0) return null

  const topGoals = goals.slice(0, 3)

  return (
    <MainCard title='Metas de ahorro' contentSX={{ p: 2.25 }}>
      <Stack spacing={2}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='body2' color='textSecondary'>Sin asignar</Typography>
          <Typography variant='h5' color='success.main'>{format.euro(unallocated)}</Typography>
        </Box>

        {topGoals.map((goal) => {
          const progress = goal.targetAmount > 0
            ? Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100)
            : 0

          return (
            <Box key={goal._id}>
              <Box display='flex' alignItems='center' gap={1} mb={0.5}>
                <GoalIcon name={goal.icon} color={goal.color} size={24} />
                <Typography variant='body2' noWrap flex={1}>{goal.name}</Typography>
                <Typography variant='body2' color='textSecondary'>
                  {progress}%
                </Typography>
              </Box>
              <LinearProgress
                variant='determinate'
                value={progress}
                sx={{ height: 6, borderRadius: 3 }}
                color={progress >= 100 ? 'success' : 'primary'}
              />
              <Typography variant='caption' color='textSecondary'>
                {format.euro(goal.currentAmount)} / {format.euro(goal.targetAmount)}
              </Typography>
            </Box>
          )
        })}
      </Stack>
    </MainCard>
  )
}

export default GoalsWidget
