import { Grid, Grow, LinearProgress, Stack, Typography, Box, Avatar } from '@mui/material'
import { useNavigate } from 'react-router'
import { MainCard } from 'components'
import { format } from 'utils'
import { useGoals } from 'hooks'
import { Goal } from 'types'
import SectionTitle from '../SectionTitle'
import { hoverCardSx } from '../shared'
import GoalIcon from '../../../Goals/components/GoalItem/GoalIcon'

interface GoalCardProps {
  goal: Goal
  index: number
  onNavigate: () => void
}

const GoalCard = ({ goal, index, onNavigate }: GoalCardProps) => {
  const progress = goal.targetAmount > 0
    ? Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100)
    : 0

  const deadlineLabel = goal.deadline
    ? new Date(goal.deadline).toLocaleDateString('es-ES')
    : null

  return (
    <Grow key={goal._id} in timeout={400 + index * 150}>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <MainCard
          contentSX={{ p: 2.25, cursor: 'pointer' }}
          sx={hoverCardSx}
          onClick={onNavigate}
        >
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant='h6' color='textSecondary' noWrap>
                {goal.name}
              </Typography>
              <Avatar sx={{ bgcolor: `${goal.color}22`, width: 36, height: 36 }}>
                <GoalIcon name={goal.icon} color={goal.color} size={20} />
              </Avatar>
            </Box>

            <Typography variant='h4'>
              {format.euro(goal.currentAmount)}
              <Typography component='span' variant='body2' color='textSecondary' sx={{ ml: 1 }}>
                ahorrado
              </Typography>
            </Typography>

            <LinearProgress
              variant='determinate'
              value={progress}
              sx={{ height: 6, borderRadius: 3 }}
              color={progress >= 100 ? 'success' : 'primary'}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant='caption' color='textSecondary'>
                Objetivo: {format.euro(goal.targetAmount)}
              </Typography>
              <Typography variant='caption' color='textSecondary'>
                {progress}% completado
              </Typography>
            </Box>

            {deadlineLabel && (
              <Typography variant='caption' color='textSecondary' suppressHydrationWarning>
                Fecha límite: {deadlineLabel}
              </Typography>
            )}
          </Stack>
        </MainCard>
      </Grid>
    </Grow>
  )
}

const GoalsWidget = () => {
  const { goals, isLoading } = useGoals()
  const navigate = useNavigate()

  if (isLoading || goals.length === 0) return null

  return (
    <>
      <SectionTitle>Metas de ahorro</SectionTitle>
      {goals.map((goal, index) => (
        <GoalCard
          key={goal._id}
          goal={goal}
          index={index}
          onNavigate={() => navigate('/metas')}
        />
      ))}
    </>
  )
}

export default GoalsWidget
