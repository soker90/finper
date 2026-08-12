import React from 'react'
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Chip,
  IconButton,
  MenuItem,
  TextField,
  CircularProgress,
  Tooltip,
  Stack,
  Paper,
  Divider,
  styled,
  useMediaQuery,
  useTheme
} from '@mui/material'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { MainCard, ItemContent } from 'components'
import { format, getId } from 'utils'
import type { CreditCard, CreditCardMovement } from 'types'

type StatusFilter = 'pending' | 'paid' | 'all'

interface CreditCardMovementsTableProps {
  creditCards: CreditCard[]
  movements: CreditCardMovement[]
  isLoading: boolean
  selectedCardIdFilter: string
  onSelectCardIdFilter: (id: string) => void
  statusFilter: StatusFilter
  onSelectStatusFilter: (status: StatusFilter) => void
  onEditMovement: (card: CreditCard, movement: CreditCardMovement) => void
  onDeleteMovement: (cardId: string, movementId: string) => void
}

// Reuses the same list-row pattern as the bank Transactions list
// (ItemContent + Paper component='li') instead of a MUI Table, since
// credit card movements now share the same data shape (category, store,
// tags, note) as bank transactions.
const MovementsList = styled('ul')({
  padding: 0,
  margin: 0,
  listStyleType: 'none',
  '& > li': {
    marginTop: 8
  }
})

export const CreditCardMovementsTable: React.FC<CreditCardMovementsTableProps> = ({
  creditCards,
  movements,
  isLoading,
  selectedCardIdFilter,
  onSelectCardIdFilter,
  statusFilter,
  onSelectStatusFilter,
  onEditMovement,
  onDeleteMovement
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <MainCard content={false}>
      <Stack
        direction={isMobile ? 'column' : 'row'}
        spacing={2}
        sx={{
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          p: 2.5
        }}
      >
        <Typography variant='subtitle1'>Movimientos de Tarjeta</Typography>

        <Stack
          direction={isMobile ? 'column' : 'row'}
          spacing={2}
          sx={{ alignItems: isMobile ? 'stretch' : 'center', flexWrap: 'wrap', width: isMobile ? '100%' : undefined }}
        >
          <TextField
            select
            size='small'
            label='Tarjeta'
            value={selectedCardIdFilter}
            onChange={(e) => onSelectCardIdFilter(e.target.value)}
            sx={{ minWidth: isMobile ? '100%' : 160 }}
          >
            {creditCards.map((card) => {
              const id = getId(card)
              return (
                <MenuItem key={id} value={id}>
                  {card.name}
                </MenuItem>
              )
            })}
          </TextField>

          <Tabs
            value={statusFilter}
            onChange={(_, val) => onSelectStatusFilter(val)}
            textColor='primary'
            indicatorColor='primary'
            variant={isMobile ? 'fullWidth' : 'standard'}
          >
            <Tab label='Pendientes' value='pending' />
            <Tab label='Pagados' value='paid' />
            <Tab label='Todos' value='all' />
          </Tabs>
        </Stack>
      </Stack>

      <Divider />

      {isLoading
        ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
          )
        : movements.length === 0
          ? (
            <Typography color='text.secondary' sx={{ p: 4, textAlign: 'center' }}>
              No hay movimientos para los filtros seleccionados.
            </Typography>
            )
          : (
            <MovementsList>
              {movements.map((m) => {
                const id = getId(m)
                const cardForMovement = creditCards.find(
                  (c) => getId(c) === m.creditCardId
                )
                const isPending = m.status === 'pending'
                return (
                  <Paper key={id} component='li' elevation={0}>
                    <ItemContent sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                      <Stack direction='row' spacing={1.5} sx={{ alignItems: 'center', minWidth: 160 }}>
                        <Typography variant='body2' color='text.secondary'>
                          {new Date(m.date).toLocaleDateString('es-ES')}
                        </Typography>
                        <Chip label={m.category?.name || 'General'} size='small' variant='outlined' />
                      </Stack>

                      <Stack direction='row' spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', flex: 1, minWidth: 160 }}>
                        {m.store?.name && (
                          <Typography variant='body2'>{m.store.name}</Typography>
                        )}
                        {m.note && (
                          <Typography variant='body2' color='text.secondary'>{m.note}</Typography>
                        )}
                        {m.tags?.map((tag) => (
                          <Chip key={tag} label={tag} size='small' variant='outlined' />
                        ))}
                      </Stack>

                      <Typography
                        variant='h5'
                        color={m.type === 'expense' ? 'error.main' : 'success.main'}
                      >
                        {m.type === 'expense' ? '-' : '+'}{format.euro(m.amount)}
                      </Typography>

                      <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
                        <Chip
                          label={isPending ? 'Pendiente' : 'Pagado'}
                          color={isPending ? 'warning' : 'success'}
                          size='small'
                          variant={isPending ? 'filled' : 'outlined'}
                        />
                        {isPending && cardForMovement && id && (
                          <Stack direction='row' spacing={0.5}>
                            <Tooltip title='Editar movimiento'>
                              <IconButton
                                size='small'
                                onClick={() => onEditMovement(cardForMovement, m)}
                              >
                                <EditOutlined style={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Eliminar movimiento'>
                              <IconButton
                                size='small'
                                color='error'
                                onClick={() => onDeleteMovement(m.creditCardId, id)}
                              >
                                <DeleteOutlined style={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        )}
                      </Stack>
                    </ItemContent>
                  </Paper>
                )
              })}
            </MovementsList>
            )}
    </MainCard>
  )
}
