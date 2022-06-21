import { FC, useState } from 'react'
import { Collapse, Divider, Paper, Typography } from '@mui/material'
import { Transaction } from 'types'
import { format } from 'utils'

import styles from './styles.module.css'
import { BankIcon } from 'components/icons'
import {dateShort} from "utils/format";

interface TransactionItemProps {
    transaction: Transaction
    forceExpand?: boolean
    cancelCreate?: () => void
}

const TransactionItem: FC<TransactionItemProps> = ({ transaction, forceExpand, cancelCreate }) => {
  const [expand, setExpand] = useState(forceExpand)

  // const hideForm = useCallback(() => {
  //   cancelCreate?.()
  //   setExpand(false)
  // }, [transaction._id])

  return (
        <>
            <Paper component='li'>
                <section onClick={() => setExpand(toggle => !toggle)}>
                    <div className={styles.logoName}>
                        <BankIcon name={transaction.account.bank} className={styles.bankLogo} />
                        <span>{format.dateShort(transaction.date)}</span>
                    </div>
                    <Typography variant='h4'
                                color='primary.main'>{format.euro(transaction.amount)}</Typography>
                </section>
                <Collapse in={expand} timeout="auto" unmountOnExit>
                    <Divider className={styles.divider} />
                    expand

                </Collapse>
            </Paper>

        </>

  )
}

export default TransactionItem
