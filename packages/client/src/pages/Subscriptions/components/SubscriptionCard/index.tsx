import { Stack, Typography } from '@mui/material'
import useSWR from 'swr'
import { MainCard } from 'components'
import { format } from 'utils'
import { Subscription, Transaction } from 'types'
import { SUBSCRIPTIONS } from 'constants/api-paths'
import { hoverCardSx } from '../../../Dashboard/components/shared'
import { CYCLE_LABELS } from '../../utils'
import SubscriptionCardHeader from './SubscriptionCardHeader'
import SubscriptionNextPayment from './SubscriptionNextPayment'
import SubscriptionPaymentList from './SubscriptionPaymentList'

type Props = {
  subscription: Subscription
  onEdit: (s: Subscription) => void
  onDelete: (s: Subscription) => void
  onSearchPayments: (s: Subscription) => void
  onUnlinkTransaction: (subscriptionId: string, transactionId: string) => void
}

const SubscriptionCard = ({ subscription, onEdit, onDelete, onSearchPayments, onUnlinkTransaction }: Props) => {
  const { data: transactions } = useSWR<Transaction[]>(
    `${SUBSCRIPTIONS}/${subscription._id}/transactions`
  )
  const lastPayments = transactions?.slice(0, 3) ?? []

  return (
    <MainCard contentSX={{ p: 2.25 }} sx={hoverCardSx}>
      <Stack spacing={1}>
        <SubscriptionCardHeader
          subscription={subscription}
          onEdit={onEdit}
          onDelete={onDelete}
          onSearchPayments={onSearchPayments}
        />

        <Typography variant='h4' color='inherit'>
          {format.euro(subscription.amount)}
          <Typography component='span' variant='body2' color='textSecondary' ml={1}>
            / {CYCLE_LABELS[subscription.cycle]}
          </Typography>
        </Typography>

        <SubscriptionNextPayment nextPaymentDate={subscription.nextPaymentDate ?? null} />

        <SubscriptionPaymentList
          transactions={lastPayments}
          subscriptionId={subscription._id}
          onUnlinkTransaction={onUnlinkTransaction}
        />
      </Stack>
    </MainCard>
  )
}

export default SubscriptionCard
