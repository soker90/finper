import { useState } from 'react'
import { useGoals, useAccounts } from 'hooks'
import GoalItem from './components/GoalItem'
import { ListContainer } from '../Accounts/components/ListContainer'
import { PlusOutlined, TrophyOutlined } from '@ant-design/icons'
import { HeaderButtons, LoadingList } from 'components'
import { TotalCard } from './components'
import { format } from 'utils'
import { Box, Typography } from '@mui/material'

const Goals = () => {
  const { goals, isLoading } = useGoals()
  const { accounts } = useAccounts()
  const [newGoal, setNewGoal] = useState(false)

  if (isLoading) {
    return <LoadingList />
  }

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
  const totalAllocated = goals.reduce((sum, g) => sum + g.currentAmount, 0)
  const unallocated = Math.max(0, totalBalance - totalAllocated)

  return (
    <>
      <HeaderButtons
        buttons={[
          { Icon: PlusOutlined, title: 'Nueva meta', onClick: () => setNewGoal(true), disabled: newGoal }
        ]}
        desktopSx={{ marginTop: -7 }}
      />

      <TotalCard
        totalBalance={totalBalance}
        totalAllocated={totalAllocated}
        unallocated={unallocated}
        format={format.euro}
      />

      <ListContainer>
        {newGoal && (
          <GoalItem
            goal={{ name: '', targetAmount: 0, currentAmount: 0, color: '#2196F3', icon: 'DollarOutlined' }}
            forceExpand
            cancelCreate={() => setNewGoal(false)}
          />
        )}
        {goals.map((goal) => (
          <GoalItem key={goal._id} goal={goal} />
        ))}
      </ListContainer>

      {!goals.length && !newGoal && (
        <Box textAlign='center' py={4}>
          <TrophyOutlined style={{ fontSize: 48, color: '#bdbdbd', marginBottom: 16 }} />
          <Typography color='text.secondary' variant='body1'>
            Define tu primera meta y empieza a ahorrar para lo que más te importa
          </Typography>
        </Box>
      )}
    </>
  )
}

export default Goals
