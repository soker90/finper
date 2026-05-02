import { FC, useCallback, useState } from 'react'
import { Collapse, Divider, Paper, Typography, useTheme, Stack, IconButton, Tooltip } from '@mui/material'
import { AimOutlined } from '@ant-design/icons'
import { Account } from 'types'

import { BankIcon, ItemContent } from 'components'
import { format } from 'utils'

import styles from './styles.module.css'
import AccountEdit from '../AccountEdit'
import AdjustBalanceModal from '../AdjustBalanceModal'

interface AccountItemProps {
  account: Account
  forceExpand?: boolean
  cancelCreate?: () => void
}

const AccountItem: FC<AccountItemProps> = ({ account, forceExpand, cancelCreate }) => {
  const theme = useTheme()
  const [expand, setExpand] = useState(forceExpand)
  const [adjustOpen, setAdjustOpen] = useState(false)

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
          <Stack direction='row' alignItems='center' gap={1}>
            <Typography
              variant='h4'
              color={theme.palette.primary.main}
            >{format.euro(account.balance)}
            </Typography>
            {account._id && (
              <Tooltip title='Ajustar saldo real'>
                <IconButton
                  size='small'
                  onClick={(e) => {
                    e.stopPropagation()
                    setAdjustOpen(true)
                  }}
                  sx={{ color: 'text.secondary' }}
                >
                  <AimOutlined style={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </ItemContent>
        <Collapse in={expand} timeout='auto' unmountOnExit>
          <Divider className={styles.divider} />
          <AccountEdit account={account} hideForm={hideForm} isNew={forceExpand} />
        </Collapse>
      </Paper>

      {account._id && (
        <AdjustBalanceModal
          open={adjustOpen}
          onClose={() => setAdjustOpen(false)}
          account={account}
        />
      )}
    </>
  )
}

export default AccountItem
