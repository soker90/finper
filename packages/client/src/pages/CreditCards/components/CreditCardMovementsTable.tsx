import React from 'react'
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Chip,
  IconButton,
  MenuItem,
  TextField,
  CircularProgress,
  Tooltip,
  Stack,
  Paper,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { MainCard } from 'components'
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
          : isMobile
            ? (
              <Stack divider={<Divider />}>
                {movements.map((m) => {
                  const id = getId(m)
                  const cardForMovement = creditCards.find(
                    (c) => getId(c) === m.creditCardId
                  )
                  const isPending = m.status === 'pending'
                  return (
                    <Paper key={id} elevation={0} sx={{ p: 2 }}>
                      <Stack direction='row' sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Typography variant='body2' color='text.secondary'>
                          {new Date(m.date).toLocaleDateString('es-ES')}
                        </Typography>
                        <Chip
                          label={isPending ? 'Pendiente' : 'Pagado'}
                          color={isPending ? 'warning' : 'success'}
                          size='small'
                          variant={isPending ? 'filled' : 'outlined'}
                        />
                      </Stack>

                      <Stack direction='row' spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
                        <Chip label={m.category?.name || 'General'} size='small' variant='outlined' />
                        {m.store?.name && (
                          <Typography variant='body2' color='text.secondary'>{m.store.name}</Typography>
                        )}
                      </Stack>

                      {m.note && (
                        <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
                          {m.note}
                        </Typography>
                      )}

                      <Stack direction='row' sx={{ justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography
                          variant='body1'
                          color={m.type === 'expense' ? 'error.main' : 'success.main'}
                          sx={{ fontWeight: 700 }}
                        >
                          {m.type === 'expense' ? '-' : '+'}{format.euro(m.amount)}
                        </Typography>

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
                    </Paper>
                  )
                })}
              </Stack>
              )
            : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Categoría</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Comercio</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Nota</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align='right'>Importe</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align='center'>Estado</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align='center'>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {movements.map((m) => {
                      const id = getId(m)
                      const cardForMovement = creditCards.find(
                        (c) => getId(c) === m.creditCardId
                      )
                      const isPending = m.status === 'pending'
                      return (
                        <TableRow key={id} hover>
                          <TableCell>{new Date(m.date).toLocaleDateString('es-ES')}</TableCell>
                          <TableCell>
                            <Chip
                              label={m.category?.name || 'General'}
                              size='small'
                              variant='outlined'
                            />
                          </TableCell>
                          <TableCell>{m.store?.name || '-'}</TableCell>
                          <TableCell>{m.note || '-'}</TableCell>
                          <TableCell align='right'>
                            <Typography
                              variant='body2'
                              color={m.type === 'expense' ? 'error.main' : 'success.main'}
                              sx={{ fontWeight: 700 }}
                            >
                              {m.type === 'expense' ? '-' : '+'}{format.euro(m.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell align='center'>
                            <Chip
                              label={isPending ? 'Pendiente' : 'Pagado'}
                              color={isPending ? 'warning' : 'success'}
                              size='small'
                              variant={isPending ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell align='center'>
                            {isPending && cardForMovement && id && (
                              <Stack direction='row' spacing={0.5} sx={{ justifyContent: 'center' }}>
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
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              )}
    </MainCard>
  )
}
