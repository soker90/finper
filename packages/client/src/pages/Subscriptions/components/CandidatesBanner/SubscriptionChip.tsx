import { Box, Avatar, Tooltip, Typography } from '@mui/material'
import { CheckOutlined } from '@ant-design/icons'
import { format } from 'utils'
import { SubscriptionCandidate } from 'types'
import { CYCLE_LABELS } from '../../utils'

type Sub = SubscriptionCandidate['subscriptionIds'][number]

type Props = {
  sub: Sub
  disabled: boolean
  onAssign: () => void
}

const SubscriptionChip = ({ sub, disabled, onAssign }: Props) => (
  <Tooltip title={`Asignar a ${sub.name}`}>
    <Box
      onClick={() => !disabled && onAssign()}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.25,
        py: 0.5,
        border: '1px solid',
        borderColor: 'primary.light',
        borderRadius: 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
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
)

export default SubscriptionChip
