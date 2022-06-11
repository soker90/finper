import { FC } from 'react'
import { Account } from 'types'
import AccountItem from './AccountItem'

interface AccountsListProps {
    accounts: Account[]
}

const AccountsList: FC<AccountsListProps> = ({ accounts }) => (
    <ul style={{ padding: 0 }}>
        {accounts.map((account) => <AccountItem key={account._id} account={account} />)}
    </ul>
)

export default AccountsList
