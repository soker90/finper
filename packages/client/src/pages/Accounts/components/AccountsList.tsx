import { FC } from 'react'
import { Account } from 'types'
import AccountItem from './AccountItem'

interface AccountsListProps {
    accounts: Account[]
    newAccount: boolean
}

const AccountsList: FC<AccountsListProps> = ({ accounts, newAccount }) => (
    <ul style={{ padding: 0, listStyleType: 'none' }}>
        {newAccount && <AccountItem account={{ name: '', bank: '', balance: 0 }} forceExpand />}
        {accounts.map((account) => <AccountItem key={account._id} account={account} />)}
    </ul>
)

export default AccountsList
