import { useState } from 'react'
import { useGoals, useAccounts } from 'hooks'
import GoalItem from './components/GoalItem'
import { ListContainer } from '../Accounts/components/ListContainer'
import { PlusOutlined } from '@ant-design/icons'
import { HeaderButtons, LoadingList } from 'components'
import { TotalCard } from './components'
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
        <p>No hay datos</p>
      )}
    </>
  )
}

export default Goals
