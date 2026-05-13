import { FC, useCallback, useState, MouseEvent } from 'react'
import { Collapse, Divider, Paper, Typography, LinearProgress, Box, IconButton, useTheme } from '@mui/material'
import { PlusOutlined, MinusOutlined } from '@ant-design/icons'
import { Goal } from 'types'
import { ItemContent } from 'components'
import { format } from 'utils'
import GoalEdit from '../GoalEdit'
import GoalFundDialog from '../GoalFundDialog'
import GoalIcon from './GoalIcon'
import styles from './styles.module.css'

interface GoalItemProps {
  goal: Goal
  forceExpand?: boolean
  cancelCreate?: () => void
}

const GoalItem: FC<GoalItemProps> = ({ goal, forceExpand, cancelCreate }) => {
  const theme = useTheme()
  const [expand, setExpand] = useState(forceExpand)
  const [fundMode, setFundMode] = useState<'fund' | 'withdraw' | null>(null)

  const progress = goal.targetAmount > 0
    ? Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100)
    : 0

  const hideForm = useCallback(() => {
    cancelCreate?.()
    setExpand(false)
  }, [cancelCreate])

  const handleFund = (e: MouseEvent, mode: 'fund' | 'withdraw') => {
    e.stopPropagation()
    setFundMode(mode)
  }

  return (
    <>
      <Paper component='li'>
        <ItemContent onClick={() => setExpand(toggle => !toggle)}>
          <div className={styles.logoName}>
            <GoalIcon name={goal.icon} color={goal.color} className={styles.goalIcon} />
            <span>{goal.name}</span>
          </div>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {goal._id && (
              <>
                <IconButton
                  size='small'
                  color='primary'
                  onClick={(e) => handleFund(e, 'fund')}
                  title='Añadir fondos'
                >
                  <PlusOutlined />
                </IconButton>
                <IconButton
                  size='small'
                  color='error'
                  onClick={(e) => handleFund(e, 'withdraw')}
                  title='Retirar fondos'
                >
                  <MinusOutlined />
                </IconButton>
              </>
            )}
            <Typography variant='h4' color={theme.palette.primary.main}>
              {format.euro(goal.currentAmount)}
            </Typography>
          </Box>
        </ItemContent>
        {goal._id && (
          <Box sx={{ px: 2, pb: 1.5 }}>
            <LinearProgress
              variant='determinate'
              value={progress}
              sx={{ height: 8, borderRadius: 3, backgroundColor: theme.palette.grey[200] }}
              color={progress >= 100 ? 'success' : 'primary'}
            />
            <Typography variant='caption' color='textSecondary' sx={{ display: 'block', mt: 0.5 }}>
              {progress}% ({format.euro(goal.currentAmount)} / {format.euro(goal.targetAmount)})
              {goal.deadline && ` • ${new Date(goal.deadline).toLocaleDateString('es-ES')}`}
            </Typography>
          </Box>
        )}
        <Collapse in={expand} timeout='auto' unmountOnExit>
          <Divider />
          <GoalEdit
            goal={goal}
            hideForm={hideForm}
            isNew={forceExpand}
          />
        </Collapse>
      </Paper>

      {goal._id && fundMode && (
        <GoalFundDialog
          goal={goal}
          open={fundMode !== null}
          mode={fundMode}
          onClose={() => setFundMode(null)}
        />
      )}
    </>
  )
}

export default GoalItem
