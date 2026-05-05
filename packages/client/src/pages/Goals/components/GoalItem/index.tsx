import { useState } from 'react'
import { Collapse, Divider, Paper, Typography, LinearProgress, Box, Stack, useTheme } from '@mui/material'
import { Goal } from 'types'
import { ItemContent } from 'components'
import { format } from 'utils'
import GoalEdit from '../GoalEdit'
import GoalFundDialog from '../GoalFundDialog'
import GoalIcon from './GoalIcon'

interface GoalItemProps {
  goal: Goal
  forceExpand?: boolean
  cancelCreate?: () => void
}

const GoalItem = ({ goal, forceExpand, cancelCreate }: GoalItemProps) => {
  const theme = useTheme()
  const [expand, setExpand] = useState(forceExpand)
  const [fundOpen, setFundOpen] = useState(false)

  const progress = goal.targetAmount > 0
    ? Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100)
    : 0

  const hideForm = () => {
    cancelCreate?.()
    setExpand(false)
  }

  return (
    <>
      <Paper component='li'>
        <ItemContent onClick={() => setExpand(toggle => !toggle)}>
          <Box display='flex' alignItems='center' gap={1.5} flex={1}>
            <GoalIcon name={goal.icon} color={goal.color} />
            <Box flex={1}>
              <Typography variant='subtitle1'>{goal.name}</Typography>
              <LinearProgress
                variant='determinate'
                value={progress}
                sx={{ height: 8, borderRadius: 3, mt: 0.5, backgroundColor: theme.palette.grey[200] }}
              />
              <Typography variant='caption' color='textSecondary'>
                {progress}% — {format.euro(goal.currentAmount)} / {format.euro(goal.targetAmount)}
                {goal.deadline && ` • ${new Date(goal.deadline).toLocaleDateString('es-ES')}`}
              </Typography>
            </Box>
          </Box>
          <Typography
            variant='h4'
            color={theme.palette.primary.main}
          >
            {format.euro(goal.currentAmount)}
          </Typography>
        </ItemContent>
        <Collapse in={expand} timeout='auto' unmountOnExit>
          <Divider />
          <Box p={2}>
            <Stack spacing={1.5} direction={{ xs: 'column', sm: 'row' }}>
              <GoalFundDialog
                goal={goal}
                open={fundOpen}
                onClose={() => setFundOpen(false)}
                onOpen={() => setFundOpen(true)}
              />
            </Stack>
          </Box>
          <Divider />
          <GoalEdit goal={goal} hideForm={hideForm} isNew={forceExpand} />
        </Collapse>
      </Paper>
    </>
  )
}

export default GoalItem
