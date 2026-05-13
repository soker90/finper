import { Grid, Grow, LinearProgress, Stack, Typography, Box, Avatar } from '@mui/material'
import { useNavigate } from 'react-router'
import { MainCard } from 'components'
import { format } from 'utils'
import { useGoals } from 'hooks'
import SectionTitle from '../SectionTitle'
import { hoverCardSx } from '../shared'
import GoalIcon from '../../../Goals/components/GoalItem/GoalIcon'

const GoalsWidget = () => {
  const { goals, isLoading } = useGoals()
  const navigate = useNavigate()

  if (isLoading || goals.length === 0) return null

  return (
    <>
      <SectionTitle>Metas de ahorro</SectionTitle>
      {goals.map((goal, i) => {
        const progress = goal.targetAmount > 0
          ? Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100)
          : 0

        return (
          <Grow key={goal._id} in timeout={400 + i * 150}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <MainCard
                contentSX={{ p: 2.25, cursor: 'pointer' }}
                sx={hoverCardSx}
                onClick={() => navigate('/metas')}
              >
                <Stack spacing={1}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant='h6' color='textSecondary' noWrap>
                      {goal.name}
                    </Typography>
                    <Avatar sx={{ bgcolor: `${goal.color}22`, width: 36, height: 36 }}>
                      <GoalIcon name={goal.icon} color={goal.color} size={20} />
                    </Avatar>
                  </Box>

                  <Typography variant='h4'>
                    {format.euro(goal.currentAmount)}
                    <Typography
                      component='span' variant='body2' color='textSecondary' sx={{
                        ml: 1
                      }}
                    >
                      ahorrado
                    </Typography>
                  </Typography>

                  <LinearProgress
                    variant='determinate'
                    value={progress}
                    sx={{ height: 6, borderRadius: 3 }}
                    color={progress >= 100 ? 'success' : 'primary'}
                  />

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Typography variant='caption' color='textSecondary'>
                      Objetivo: {format.euro(goal.targetAmount)}
                    </Typography>
                    <Typography variant='caption' color='textSecondary'>
                      {progress}% completado
                    </Typography>
                  </Box>

                  {goal.deadline && (
                    <Typography variant='caption' color='textSecondary'>
                      Fecha límite: {new Date(goal.deadline).toLocaleDateString('es-ES')}
                    </Typography>
                  )}
                </Stack>
              </MainCard>
            </Grid>
          </Grow>
        )
      })}
    </>
  )
}

export default GoalsWidget
