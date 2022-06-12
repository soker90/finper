import { FC, useState } from 'react'
import { Collapse, Divider, Paper, Typography, useTheme } from '@mui/material'

import { Account } from '../../../../types'
import { BankIcon } from 'components'
import { format } from 'utils'

import styles from './styles.module.css'
import AccountEdit from '../AccountEdit'

interface AccountItemProps {
    account: Account
}

const AccountItem: FC<AccountItemProps> = ({ account }) => {
  const theme = useTheme()
  const [expand, setExpand] = useState(false)

  return (
        <>
            <Paper component='li' className={styles.container}>
                <section onClick={() => setExpand(toggle => !toggle)}>
                    <div className={styles.logoName}>
                        <BankIcon name={account.bank} className={styles.bankLogo} />
                        <span>{account.name}</span>
                    </div>
                    <Typography variant='h4'
                                color={theme.palette.primary.main}>{format.euro(account.balance)}</Typography>
                </section>
                <Collapse in={expand} timeout="auto" unmountOnExit>
                    <Divider className={styles.divider} />
                    <AccountEdit account={account} />

                </Collapse>
            </Paper>

        </>

  )
}

export default AccountItem
