import { useTransactions } from '../hooks'
import TransactionItem from './TransactionItem'
import { LoadingList } from 'components'

export const TransactionsPage = ({ index, filters }: { index: number, filters: any }) => {
  const { transactions, isLoading, query } = useTransactions({ index, filters })

  if (isLoading) {
    return <LoadingList />
  }

  return (
        <>
            {transactions.map((transaction) =>
                <TransactionItem key={transaction._id} transaction={transaction}
                                 query={query} />)}

            {!transactions.length && !index && <p>No hay datos</p>}
        </>
  )
}
