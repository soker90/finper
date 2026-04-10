import { Box, Stack, Typography, Avatar, IconButton, Tooltip } from '@mui/material'
import { EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { Subscription } from 'types'

type Props = {
  subscription: Subscription
  onEdit: (s: Subscription) => void
  onDelete: (s: Subscription) => void
  onSearchPayments: (s: Subscription) => void
}

const SubscriptionCardHeader = ({ subscription, onEdit, onDelete, onSearchPayments }: Props) => (
  <Box display='flex' justifyContent='space-between' alignItems='center'>
    <Stack direction='row' spacing={1} alignItems='center' minWidth={0}>
      <Avatar
        src={subscription.logoUrl}
        alt={subscription.name}
        sx={{ width: 32, height: 32, bgcolor: 'primary.lighter', color: 'primary.main', fontSize: 14, fontWeight: 700 }}
      >
        {subscription.name.charAt(0).toUpperCase()}
      </Avatar>
      <Typography variant='h6' color='textSecondary' noWrap>
        {subscription.name}
      </Typography>
    </Stack>

    <Stack direction='row' spacing={0.5}>
      <Tooltip title='Buscar pagos anteriores'>
        <IconButton size='small' color='primary' aria-label='Buscar pagos anteriores' onClick={() => onSearchPayments(subscription)}>
          <SearchOutlined />
        </IconButton>
      </Tooltip>
      <Tooltip title='Editar'>
        <IconButton size='small' aria-label='Editar' onClick={() => onEdit(subscription)}>
          <EditOutlined />
        </IconButton>
      </Tooltip>
      <Tooltip title='Eliminar'>
        <IconButton size='small' color='error' aria-label='Eliminar' onClick={() => onDelete(subscription)}>
          <DeleteOutlined />
        </IconButton>
      </Tooltip>
    </Stack>
  </Box>
)

export default SubscriptionCardHeader
