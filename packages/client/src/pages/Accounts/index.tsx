import { useAccounts } from './hooks'
import { LoadingBanks, AccountsList } from './components'

const Accounts = () => {
  const { accounts, isLoading } = useAccounts()

  if (isLoading) {
    return <LoadingBanks />
  }
  if (!accounts.length) {
    return <p>No hay datos</p>
  }

  return <AccountsList accounts={accounts} newAccount={false} />
}

export default Accounts
