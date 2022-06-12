import { FC } from 'react'
import { Account } from '../../../../types'
import { Paper } from '@mui/material'
import styles from './styles.module.css'
import { BankIcon } from 'components/icons'

interface AccountItemProps {
    account: Account
}

const AccountItem: FC<AccountItemProps> = ({ account }) => {
  return (
        <Paper className={styles.container} component='li' >
            <div className={styles.logoName}>
                <BankIcon name={account.bank} className={styles.bankLogo} />
                <span>{account.name}</span>
            </div>
            - {account.balance}€
        </Paper>
  )
}

export default AccountItem
