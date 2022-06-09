import { FC } from 'react'
import { Account } from '../../../../types'
import openbankLogo from 'assets/img/banks/openbank-logo.jpg'
import { Paper } from '@mui/material'
import styles from './styles.module.css'

interface AccountItemProps {
    account: Account
}

const AccountItem: FC<AccountItemProps> = ({ account }) => {
  return (
        <Paper className={styles.container}>
            <img className={styles.bankLogo} src={openbankLogo} alt={account.bank} /> {account.name} - {account.balance}€
        </Paper>
  )
}

export default AccountItem
