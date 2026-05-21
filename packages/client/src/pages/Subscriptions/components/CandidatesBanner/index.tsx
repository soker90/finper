import { Stack, Typography, Divider } from '@mui/material'
import { MainCard } from 'components'
import { SubscriptionCandidate } from 'types'
import CandidateRow from './CandidateRow'

type Props = {
  candidates: SubscriptionCandidate[]
  onAssign: (candidateId: string, subscriptionId: string) => Promise<{ error?: string }>
  onDismiss: (candidateId: string) => Promise<{ error?: string }>
}

const CandidatesBanner = ({ candidates, onAssign, onDismiss }: Props) => {
  if (candidates.length === 0) return null

  return (
    <MainCard data-testid='candidates-banner' contentSX={{ p: 2.25 }} sx={{ mb: 2 }}>
      <Typography
        variant='body1'
        color='textSecondary'
        sx={{
          fontWeight: 600,
          mb: 1.5
        }}
      >
        Posibles pagos de suscripción detectados
      </Typography>
      <Stack spacing={1.5} divider={<Divider flexItem />}>
        {candidates.map((candidate) => (
          <CandidateRow
            key={candidate._id}
            candidate={candidate}
            onAssign={onAssign}
            onDismiss={onDismiss}
          />
        ))}
      </Stack>
    </MainCard>
  )
}

export default CandidatesBanner
