import { useState } from 'react'
import {
  Typography, Box, Checkbox, List, ListItem,
  ListItemText, ListItemIcon, CircularProgress, Alert
} from '@mui/material'
import { SearchOutlined } from '@ant-design/icons'
import useSWR from 'swr'
import ModalGrid from 'components/modals/ModalGrid'
import { format } from 'utils'
import { Yield, YieldEntry } from 'types'
import { YIELDS } from 'constants/api-paths'
import { linkYieldTransactions } from 'services/apiService'

type Props = {
  item: Yield
  onClose: () => void
  onLinked: () => void
}

const LinkTransactionsModal = ({ item, onClose, onLinked }: Props) => {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

  const { data: transactions, isLoading } = useSWR<YieldEntry[]>(
    `${YIELDS}/${item._id}/matching-transactions`
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
    const result = await linkYieldTransactions(item._id, [...selected])
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
      title={`Movimientos de ${item.name}`}
      onClose={onClose}
      action={handleSubmit}
      actionDisabled={submitting || selected.size === 0}
    >
      <Box sx={{ width: '100%', gridColumn: '1 / -1' }}>
        <Typography variant='caption' color='textSecondary' sx={{ display: 'block', mb: 1 }}>
          Marca tanto el abono como, si tu banco lo separa, el impuesto retenido o los recibos
          relacionados — todos se enlazan a este rendimiento.
        </Typography>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {!isLoading && (!transactions || transactions.length === 0) && (
          <Alert severity='info' icon={<SearchOutlined />}>
            No hay movimientos sin enlazar en la cuenta {item.account.name}.
          </Alert>
        )}

        {linkError && (
          <Alert severity='error' sx={{ mt: 1 }}>{linkError}</Alert>
        )}

        {!isLoading && transactions && transactions.length > 0 && (
          <>
            <Typography variant='caption' color='textSecondary' sx={{ display: 'block', mb: 1 }}>
              {transactions.length} movimiento{transactions.length > 1 ? 's' : ''} encontrado{transactions.length > 1 ? 's' : ''} · cuenta {item.account.name}
            </Typography>
            <Box sx={{ maxHeight: 360, overflowY: 'auto', pr: 0.5 }}>
              <List dense disablePadding>
                {transactions.map((tx) => {
                  const checked = selected.has(tx._id)
                  return (
                    <ListItem
                      key={tx._id}
                      disablePadding
                      onClick={() => toggle(tx._id)}
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
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant='body2' sx={{ fontWeight: checked ? 600 : 400 }}>
                              {format.date(tx.date)}
                            </Typography>
                            <Typography variant='body2' sx={{ fontWeight: 600, color: checked ? 'primary.main' : 'inherit' }}>
                              {format.euro(tx.amount)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant='caption' color='textSecondary'>
                            {tx.category?.name} · {tx.type === 'income' ? 'Ingreso' : 'Gasto'}
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
