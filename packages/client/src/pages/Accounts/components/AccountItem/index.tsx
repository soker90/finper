import { FC, useCallback, useState } from 'react'
import { Collapse, Divider, Paper, Typography, useTheme } from '@mui/material'
import { Account } from 'types'

import { BankIcon, ItemContent } from 'components'
import { format } from 'utils'

import styles from './styles.module.css'
import AccountEdit from '../AccountEdit'

interface AccountItemProps {
    account: Account
    forceExpand?: boolean
    cancelCreate?: () => void
}

const AccountItem: FC<AccountItemProps> = ({ account, forceExpand, cancelCreate }) => {
  const theme = useTheme()
  const [expand, setExpand] = useState(forceExpand)

  const hideForm = useCallback(() => {
    cancelCreate?.()
    setExpand(false)
  }, [account._id])

  return (
        <>
            <Paper component='li'>
                <ItemContent onClick={() => setExpand(toggle => !toggle)}>
                    <div className={styles.logoName}>
                        <BankIcon name={account.bank} className={styles.bankLogo} width={32} height={32} />
                        <span>{account.name}</span>
                    </div>
                    <Typography variant='h4'
                                color={theme.palette.primary.main}>{format.euro(account.balance)}</Typography>
                </ItemContent>
                <Collapse in={expand} timeout="auto" unmountOnExit>
                    <Divider className={styles.divider} />
                    <AccountEdit account={account} hideForm={hideForm} isNew={forceExpand} />

                </Collapse>
            </Paper>

        </>

  )
}

export default AccountItem
