import { useState } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { format } from 'utils'
import { SubscriptionCandidate } from 'types'
import DismissButton from './DismissButton'
import SubscriptionChip from './SubscriptionChip'

type Props = {
  candidate: SubscriptionCandidate
  onAssign: (candidateId: string, subscriptionId: string) => Promise<{ error?: string }>
  onDismiss: (candidateId: string) => Promise<{ error?: string }>
}

const CandidateRow = ({ candidate, onAssign, onDismiss }: Props) => {
  const [loading, setLoading] = useState(false)
  const tx = candidate.transactionId

  const handleAssign = async (subscriptionId: string) => {
    setLoading(true)
    await onAssign(candidate._id, subscriptionId)
    setLoading(false)
  }

  const handleDismiss = async () => {
    setLoading(true)
    await onDismiss(candidate._id)
    setLoading(false)
  }

  return (
    <Box>
      {/* Movimiento detectado */}
      <Box display='flex' justifyContent='space-between' alignItems='center' mb={1}>
        <Box>
          <Typography variant='body2' fontWeight={600}>
            {format.euro(tx.amount)} · {format.date(tx.date)}
          </Typography>
          <Typography variant='caption' color='textSecondary'>
            {tx.category?.name} · {tx.account?.name}
          </Typography>
        </Box>
        <DismissButton disabled={loading} onClick={handleDismiss} />
      </Box>

      {/* Suscripciones candidatas */}
      <Stack direction='row' spacing={1} flexWrap='wrap'>
        {candidate.subscriptionIds.map((sub) => (
          <SubscriptionChip
            key={sub._id}
            sub={sub}
            disabled={loading}
            onAssign={() => handleAssign(sub._id)}
          />
        ))}
      </Stack>
    </Box>
  )
}

export default CandidateRow
