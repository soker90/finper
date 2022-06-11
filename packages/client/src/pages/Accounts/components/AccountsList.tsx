import { FC } from 'react'
import { Account } from '../../../types'
import AccountItem from './AccountItem'

interface AccountsListProps {
    accounts: Account[]
}

const AccountsList: FC<AccountsListProps> = ({ accounts }) => (
    <div>
        {accounts.map((account) => <AccountItem account={account} />)}
    </div>
)

export default AccountsList
