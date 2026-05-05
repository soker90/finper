import { useState } from 'react'
import { Stack, Typography } from '@mui/material'
import { useGoals, useAccounts } from 'hooks'
import GoalItem from './components/GoalItem'
import { ListContainer } from './components/ListContainer'
import { PlusOutlined } from '@ant-design/icons'
import { MainCard, HeaderButtons, LoadingList } from 'components'
import { format } from 'utils'

const Goals = () => {
  const { goals, isLoading } = useGoals()
  const { accounts } = useAccounts()
  const [newGoal, setNewGoal] = useState(false)

  if (isLoading) {
    return <LoadingList />
  }

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
  const totalAllocated = goals.reduce((sum, g) => sum + g.currentAmount, 0)
  const unallocated = totalBalance - totalAllocated

  return (
    <>
      <HeaderButtons
        buttons={[
          { Icon: PlusOutlined, title: 'Nueva meta', onClick: () => setNewGoal(true), disabled: newGoal }
        ]}
        desktopSx={{ marginTop: -7 }}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        <MainCard contentSX={{ p: 2.25 }} sx={{ maxWidth: { sm: 250 } }}>
          <Stack spacing={0.5}>
            <Typography variant='h4'>Total</Typography>
            <Typography variant='h4' color='info.main'>{format.euro(totalBalance)}</Typography>
          </Stack>
        </MainCard>
        <MainCard contentSX={{ p: 2.25 }} sx={{ maxWidth: { sm: 250 } }}>
          <Stack spacing={0.5}>
            <Typography variant='h4'>Sin asignar</Typography>
            <Typography variant='h4' color='success.main'>{format.euro(Math.max(0, unallocated))}</Typography>
          </Stack>
        </MainCard>
      </Stack>

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
        <Typography variant='body1' color='textSecondary' textAlign='center' mt={4}>
          No hay metas creadas
        </Typography>
      )}
    </>
  )
}

export default Goals
