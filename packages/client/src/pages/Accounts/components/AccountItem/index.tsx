import { FC } from 'react'
import { Account } from '../../../../types'
import { Paper } from '@mui/material'
import styles from './styles.module.css'
import { OpenBankIcon } from 'components/icons'

interface AccountItemProps {
    account: Account
}

// TODO: get icon by bank name

const AccountItem: FC<AccountItemProps> = ({ account }) => {
  return (
        <Paper className={styles.container} component='li'>
            <div className={styles.logoName}>
                <OpenBankIcon className={styles.bankLogo} />
                <span>{account.name}</span>
            </div>
            - {account.balance}€
        </Paper>
  )
}

export default AccountItem
