import { Stack, Typography, Chip, Box, Avatar, IconButton, Tooltip, Divider, List, ListItem, ListItemText } from '@mui/material'
import { EditOutlined, DeleteOutlined, SearchOutlined, DisconnectOutlined } from '@ant-design/icons'
import useSWR from 'swr'
import { MainCard } from 'components'
import { format } from 'utils'
import { Subscription, Transaction } from 'types'
import { SUBSCRIPTIONS } from 'constants/api-paths'
import { hoverCardSx } from '../../Dashboard/components/shared'
import { CYCLE_LABELS } from '../utils'

const getDaysChipColor = (days: number): 'error' | 'warning' | 'success' | 'default' => {
  if (days < 0) return 'error'
  if (days <= 3) return 'warning'
  if (days <= 7) return 'success'
  return 'default'
}

type Props = {
  subscription: Subscription
  onEdit: (s: Subscription) => void
  onDelete: (s: Subscription) => void
  onSearchPayments: (s: Subscription) => void
  onUnlinkTransaction: (subscriptionId: string, transactionId: string) => void
}

const SubscriptionCard = ({ subscription, onEdit, onDelete, onSearchPayments, onUnlinkTransaction }: Props) => {
  const hasDate = Boolean(subscription.nextPaymentDate)
  const days = hasDate ? Math.ceil((subscription.nextPaymentDate! - Date.now()) / (1000 * 60 * 60 * 24)) : null
  const daysLabel = days === null ? null : days < 0 ? `Vencida hace ${Math.abs(days)}d` : days === 0 ? 'Hoy' : `En ${days}d`

  const { data: transactions } = useSWR<Transaction[]>(
    `${SUBSCRIPTIONS}/${subscription._id}/transactions`
  )
  const lastPayments = transactions?.slice(0, 3) ?? []

  return (
    <MainCard contentSX={{ p: 2.25 }} sx={hoverCardSx}>
      <Stack spacing={1}>
        {/* Header: logo + nombre */}
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

        {/* Importe */}
        <Typography variant='h4' color='inherit'>
          {format.euro(subscription.amount)}
          <Typography component='span' variant='body2' color='textSecondary' ml={1}>
            / {CYCLE_LABELS[subscription.cycle]}
          </Typography>
        </Typography>

        {/* Próximo pago */}
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          {hasDate
            ? (
              <>
                <Typography variant='caption' color='textSecondary'>
                  {format.date(subscription.nextPaymentDate!)}
                </Typography>
                <Chip label={daysLabel!} size='small' color={getDaysChipColor(days!)} />
              </>
              )
            : (
              <Typography variant='caption' color='textSecondary' fontStyle='italic'>
                Sin pagos registrados
              </Typography>
              )}
        </Box>

        {/* Últimos pagos */}
        {lastPayments.length > 0 && (
          <>
            <Divider />
            <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, px: 1, py: 0.5, mx: -1 }}>
              <Typography variant='caption' color='textSecondary' fontWeight={600} display='block' mb={0.5}>
                Últimos pagos
              </Typography>
              <List dense disablePadding>
                {lastPayments.map((t) => (
                  <ListItem key={t._id} disablePadding sx={{ py: 0.25 }}>
                    <ListItemText
                      primary={
                        <Box display='flex' justifyContent='space-between' alignItems='center'>
                          <Typography variant='caption' color='textSecondary'>
                            {format.date(t.date)}
                          </Typography>
                          <Box display='flex' alignItems='center' gap={0.5}>
                            <Typography variant='caption' fontWeight={600}>
                              {format.euro(t.amount)}
                            </Typography>
                            <Tooltip title='Desvincular'>
                              <IconButton size='small' aria-label='Desvincular' onClick={() => onUnlinkTransaction(subscription._id, t._id!)} sx={{ p: 0.25 }}>
                                <DisconnectOutlined style={{ fontSize: 11 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </>
        )}
      </Stack>
    </MainCard>
  )
}

export default SubscriptionCard
