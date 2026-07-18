import {
  Typography, Box, Checkbox, List, ListItem,
  ListItemText, ListItemIcon, CircularProgress, Alert
} from '@mui/material'
import { SearchOutlined } from '@ant-design/icons'
import { format } from 'utils'
import { YieldEntry } from 'types'

interface Props {
  isLoading: boolean
  transactions?: YieldEntry[]
  selected: Set<string>
  onToggle: (id: string) => void
  accountName: string
  hasActiveFilter: boolean
}

/** Loading/empty states and the scrollable checklist of candidate transactions. */
const TransactionCheckList = ({ isLoading, transactions, selected, onToggle, accountName, hasActiveFilter }: Props) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Alert severity='info' icon={<SearchOutlined />}>
        {hasActiveFilter
          ? 'Sin resultados para este filtro.'
          : `No hay movimientos candidatos sin enlazar para la cuenta ${accountName}.`}
      </Alert>
    )
  }

  return (
    <>
      <Typography variant='caption' color='textSecondary' sx={{ display: 'block', mb: 1 }}>
        {transactions.length} movimiento{transactions.length > 1 ? 's' : ''} encontrado{transactions.length > 1 ? 's' : ''} · cuenta {accountName}
        {transactions.length === 50 && ' · mostrando los 50 más recientes, filtra por categoría o fecha para encontrar otros más antiguos'}
      </Typography>
      <Box sx={{ maxHeight: 280, overflowY: 'auto', pr: 0.5 }}>
        <List dense disablePadding>
          {transactions.map((tx) => {
            const checked = selected.has(tx._id)
            return (
              <ListItem
                key={tx._id}
                disablePadding
                onClick={() => onToggle(tx._id)}
                role='button'
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onToggle(tx._id)
                  }
                }}
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
                  <Checkbox checked={checked} size='small' color='primary' tabIndex={-1} disableRipple />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant='body2' sx={{ fontWeight: checked ? 600 : 400 }}>
                        {format.date(tx.date)} · {tx.note || 'Sin nota'}
                      </Typography>
                      <Typography variant='body2' sx={{ fontWeight: 600, color: checked ? 'primary.main' : 'inherit' }}>
                        {format.euro(tx.amount)}
                      </Typography>
                    </Box>
                   }
                  secondary={
                    <Typography variant='caption' color='textSecondary'>
                      Categoría: {tx.category?.name} · {tx.type === 'income' ? 'Ingreso' : 'Gasto'}
                    </Typography>
                   }
                />
              </ListItem>
            )
          })}
        </List>
      </Box>
    </>
  )
}

export default TransactionCheckList
