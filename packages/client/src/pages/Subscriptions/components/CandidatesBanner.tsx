import { Stack, Typography, Box, Avatar, IconButton, Tooltip, Divider } from '@mui/material'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { MainCard } from 'components'
import { format } from 'utils'
import { SubscriptionCandidate } from 'types'
import { useState } from 'react'
import { CYCLE_LABELS } from '../utils'

type Props = {
  candidates: SubscriptionCandidate[]
  onAssign: (candidateId: string, subscriptionId: string) => Promise<{ error?: string }>
  onDismiss: (candidateId: string) => Promise<{ error?: string }>
}

const CandidatesBanner = ({ candidates, onAssign, onDismiss }: Props) => {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  if (candidates.length === 0) return null

  const handleAssign = async (candidateId: string, subscriptionId: string) => {
    setLoadingId(candidateId + subscriptionId)
    await onAssign(candidateId, subscriptionId)
    setLoadingId(null)
  }

  const handleDismiss = async (candidateId: string) => {
    setLoadingId(candidateId)
    await onDismiss(candidateId)
    setLoadingId(null)
  }

  return (
    <MainCard contentSX={{ p: 2.25 }} sx={{ mb: 2 }}>
      <Typography variant='body1' color='textSecondary' fontWeight={600} mb={1.5}>
        Posibles pagos de suscripción detectados
      </Typography>

      <Stack spacing={1.5} divider={<Divider flexItem />}>
        {candidates.map((candidate) => {
          const tx = candidate.transactionId
          const isLoading = loadingId?.startsWith(candidate._id) ?? false

          return (
            <Box key={candidate._id}>
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
                <Tooltip title='No es una suscripción'>
                  <IconButton
                    size='small'
                    disabled={isLoading}
                    onClick={() => handleDismiss(candidate._id)}
                  >
                    <CloseOutlined />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Suscripciones candidatas */}
              <Stack direction='row' spacing={1} flexWrap='wrap'>
                {candidate.subscriptionIds.map((sub) => (
                  <Tooltip key={sub._id} title={`Asignar a ${sub.name}`}>
                    <Box
                      onClick={() => !isLoading && handleAssign(candidate._id, sub._id)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        px: 1.25,
                        py: 0.5,
                        border: '1px solid',
                        borderColor: 'primary.light',
                        borderRadius: 1,
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.5 : 1,
                        transition: 'background 0.15s',
                        '&:hover': { bgcolor: 'primary.lighter' }
                      }}
                    >
                      <Avatar
                        src={sub.logoUrl}
                        sx={{ width: 20, height: 20, fontSize: 10, bgcolor: 'primary.lighter', color: 'primary.main' }}
                      >
                        {sub.name.charAt(0)}
                      </Avatar>
                      <Typography variant='caption' fontWeight={600} color='primary.main'>
                        {sub.name}
                      </Typography>
                      <Typography variant='caption' color='textSecondary'>
                        {format.euro(sub.amount)} / {CYCLE_LABELS[sub.cycle]}
                      </Typography>
                      <CheckOutlined style={{ fontSize: 11, color: 'inherit' }} />
                    </Box>
                  </Tooltip>
                ))}
              </Stack>
            </Box>
          )
        })}
      </Stack>
    </MainCard>
  )
}

export default CandidatesBanner
