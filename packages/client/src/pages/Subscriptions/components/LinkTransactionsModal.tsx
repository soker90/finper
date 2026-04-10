import { useState } from 'react'
import {
  Typography, Box, Checkbox, List, ListItem,
  ListItemText, ListItemIcon, CircularProgress, Alert
} from '@mui/material'
import { SearchOutlined } from '@ant-design/icons'
import useSWR from 'swr'
import ModalGrid from 'components/modals/ModalGrid'
import { format } from 'utils'
import { Transaction, Subscription } from 'types'
import { SUBSCRIPTIONS } from 'constants/api-paths'
import { linkSubscriptionTransactions } from 'services/apiService'

// Tipo para transacciones con relaciones populadas desde la API
type PopulatedTransaction = Transaction & {
  category?: { name: string }
  account?: { name: string }
}

type Props = {
  subscription: Subscription
  onClose: () => void
  onLinked: () => void
}

const LinkTransactionsModal = ({ subscription, onClose, onLinked }: Props) => {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

  const { data: transactions, isLoading } = useSWR<PopulatedTransaction[]>(
    `${SUBSCRIPTIONS}/${subscription._id}/matching-transactions`
  )

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const handleSubmit = async () => {
    if (selected.size === 0) return
    setSubmitting(true)
    setLinkError(null)
    const result = await linkSubscriptionTransactions(subscription._id, [...selected])
    setSubmitting(false)
    if (result.error) {
      setLinkError(result.error)
      return
    }
    onLinked()
    onClose()
  }

  return (
    <ModalGrid
      show
      title={`Pagos de ${subscription.name}`}
      onClose={onClose}
      action={handleSubmit}
      actionDisabled={submitting || selected.size === 0}
    >
      <Box sx={{ width: '100%', gridColumn: '1 / -1' }}>
        {isLoading && (
          <Box display='flex' justifyContent='center' py={3}>
            <CircularProgress size={28} />
          </Box>
        )}

        {!isLoading && (!transactions || transactions.length === 0) && (
          <Alert severity='info' icon={<SearchOutlined />}>
            No hay movimientos sin asignar con la misma categoría y cuenta que esta suscripción.
          </Alert>
        )}

        {linkError && (
          <Alert severity='error' sx={{ mt: 1 }}>{linkError}</Alert>
        )}

        {!isLoading && transactions && transactions.length > 0 && (
          <>
            <Typography variant='caption' color='textSecondary' display='block' mb={1}>
              {transactions.length} movimiento{transactions.length > 1 ? 's' : ''} encontrado{transactions.length > 1 ? 's' : ''} · misma categoría y cuenta
            </Typography>
            <Box sx={{ maxHeight: 360, overflowY: 'auto', pr: 0.5 }}>
              <List dense disablePadding>
                {transactions.map((tx) => {
                  if (!tx._id) return null
                  const checked = selected.has(tx._id)
                  return (
                    <ListItem
                      key={tx._id}
                      disablePadding
                      onClick={() => toggle(tx._id!)}
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 1,
                        mb: 0.5,
                        px: 1,
                        bgcolor: checked ? 'primary.lighter' : 'transparent',
                        border: '1px solid',
                        borderColor: checked ? 'primary.light' : 'divider',
                        transition: 'all 0.15s'
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Checkbox checked={checked} size='small' color='primary' tabIndex={-1} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display='flex' justifyContent='space-between' alignItems='center'>
                            <Typography variant='body2' fontWeight={checked ? 600 : 400}>
                              {format.date(tx.date)}
                            </Typography>
                            <Typography variant='body2' fontWeight={600} color={checked ? 'primary.main' : 'inherit'}>
                              {format.euro(tx.amount)}
                            </Typography>
                          </Box>
                      }
                        secondary={
                          <Typography variant='caption' color='textSecondary'>
                            {tx.category?.name} · {tx.account?.name}
                          </Typography>
                      }
                      />
                    </ListItem>
                  )
                })}
              </List>
            </Box>
          </>
        )}
      </Box>
    </ModalGrid>
  )
}

export default LinkTransactionsModal
