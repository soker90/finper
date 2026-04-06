import { useState } from 'react'
import { Grid } from '@mui/material'
import { PlusOutlined } from '@ant-design/icons'
import { mutate } from 'swr'

import { HeaderButtons } from 'components'
import { useSubscriptions } from 'hooks/useSubscriptions'
import { useSubscriptionCandidates } from 'hooks/useSubscriptionCandidates'
import { Subscription, SubscriptionInput } from 'types'
import { SUBSCRIPTIONS } from 'constants/api-paths'
import { unlinkSubscriptionTransaction } from 'services/apiService'

import { SubscriptionCard, SubscriptionForm, CandidatesBanner, LinkTransactionsModal } from './components'
import { SubscriptionsSummary, SubscriptionsEmpty, SubscriptionsSkeleton } from './utils'

const Subscriptions = () => {
  const { subscriptions, isLoading, createSubscription, updateSubscription, removeSubscription } = useSubscriptions()
  const { candidates, assign, dismiss } = useSubscriptionCandidates()

  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Subscription | undefined>()
  const [searchTarget, setSearchTarget] = useState<Subscription | null>(null)

  const handleEdit = (s: Subscription) => setEditTarget(s)
  const handleCloseForm = () => { setShowForm(false); setEditTarget(undefined) }

  const handleSubmitForm = (data: SubscriptionInput) =>
    editTarget?._id
      ? updateSubscription(editTarget._id, data)
      : createSubscription(data)

  const handleLinked = () => {
    // Revalidar la lista y los pagos de la suscripción vinculada
    mutate(SUBSCRIPTIONS)
    if (searchTarget) mutate(`${SUBSCRIPTIONS}/${searchTarget._id}/transactions`)
  }

  const handleUnlinkTransaction = async (subscriptionId: string, transactionId: string) => {
    await unlinkSubscriptionTransaction(subscriptionId, transactionId)
    mutate(SUBSCRIPTIONS)
    mutate(`${SUBSCRIPTIONS}/${subscriptionId}/transactions`)
  }

  return (
    <>
      <HeaderButtons
        buttons={[{ Icon: PlusOutlined, title: 'Nueva', onClick: () => setShowForm(true) }]}
        desktopSx={{ marginTop: -7 }}
      />

      <SubscriptionsSummary subscriptions={subscriptions} isLoading={isLoading} />

      <CandidatesBanner candidates={candidates} onAssign={assign} onDismiss={dismiss} />

      {isLoading && <SubscriptionsSkeleton />}

      {!isLoading && subscriptions.length === 0 && (
        <SubscriptionsEmpty onNew={() => setShowForm(true)} />
      )}

      {!isLoading && subscriptions.length > 0 && (
        <Grid container spacing={2}>
          {subscriptions.map((sub) => (
            <Grid key={sub._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <SubscriptionCard
                subscription={sub}
                onEdit={handleEdit}
                onDelete={(s) => removeSubscription(s._id)}
                onSearchPayments={setSearchTarget}
                onUnlinkTransaction={handleUnlinkTransaction}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {(showForm || Boolean(editTarget)) && (
        <SubscriptionForm
          subscription={editTarget}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
        />
      )}

      {searchTarget && (
        <LinkTransactionsModal
          subscription={searchTarget}
          onClose={() => setSearchTarget(null)}
          onLinked={handleLinked}
        />
      )}
    </>
  )
}

export default Subscriptions
