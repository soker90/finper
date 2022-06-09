import { Skeleton } from '@mui/material'
import { useAccounts } from './hooks'

const Accounts = () => {
  const { accounts, isLoading } = useAccounts()

  if (isLoading) {
    return <>
            <Skeleton height={128} animation="wave" />
            <Skeleton height={128} animation="wave" />
            <Skeleton height={128} animation="wave" />
            <Skeleton height={128} animation="wave" />
        </>
  }
  if (!accounts.length) {
    return <p>No hay datos</p>
  }

  return accounts.map((account) => <div key={account._id}>{account.name} {account.balance}€</div>)
}

export default Accounts
