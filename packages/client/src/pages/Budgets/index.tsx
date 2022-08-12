import { useBudgets } from './hooks'
import { useParams } from 'react-router-dom'

const Budgets = () => {
  const { year, month } = useParams()
  const { budgets } = useBudgets({ year, month })
  return budgets.map((budget) => (
        <p key={budget._id}>{budget._id}</p>
  ))
}

export default Budgets
