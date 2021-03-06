import { FC, useCallback, useState } from 'react'
import { Collapse, Divider, Paper, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import { Transaction } from 'types'
import { format } from 'utils'

import { BankIcon } from 'components/icons'
import { AMOUNT_COLORS, TRANSACTION_SYMBOL } from './constans'
import styles from './styles.module.css'
import { ItemContent } from 'components'
import TransactionEdit from '../TransactionEdit'

interface TransactionItemProps {
    transaction?: Transaction
    forceExpand?: boolean
    cancelCreate?: () => void
    query: string
}

const TransactionItem: FC<TransactionItemProps> = ({ transaction, forceExpand, cancelCreate, query }) => {
  const [expand, setExpand] = useState(forceExpand)
  const theme = useTheme()

  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))

  const hideForm = useCallback(() => {
    cancelCreate?.()
    setExpand(false)
  }, [transaction?._id])

  return (
        <>
            <Paper component='li'>
                {transaction && <ItemContent onClick={() => setExpand(toggle => !toggle)}>
                  <div className={styles.logoName}>
                    <BankIcon name={transaction.account?.bank} className={styles.bankLogo} height={32} width={32} />
                    <span>{format.dateShort(transaction.date)}</span>
                  </div>
                  <Stack spacing={1} direction='row' pr={isDesktop ? '50%' : undefined}>
                    <Typography variant='body1'>{transaction.category?.name}</Typography>
                      {transaction.store && <Typography variant='body1'>({transaction.store?.name})</Typography>}
                  </Stack>
                  <Typography variant='h4'
                              color={AMOUNT_COLORS[transaction.type]}>{TRANSACTION_SYMBOL[transaction.type]}{format.euro(transaction.amount)}</Typography>
                </ItemContent>}
                <Collapse in={expand} timeout="auto" unmountOnExit>
                    <Divider className={styles.divider} />
                    <TransactionEdit transaction={transaction} hideForm={hideForm} query={query} />

                </Collapse>
            </Paper>

        </>

  )
}

export default TransactionItem
