import React, { useState } from 'react'
import {
  Box,
  Grid,
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
  Alert,
  Stack
} from '@mui/material'
import {
  CreditCardOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  AuditOutlined
} from '@ant-design/icons'

import { HeaderButtons, MainCard } from 'components'
import KpiCard from '../Dashboard/components/KpiCard'
import { format } from 'utils'
import { useCreditCards, useCreditCardMovements, useCreditCardMutate } from './hooks/useCreditCards'
import { CreditCardCard } from './CreditCardCard'
import { ModalCreditCard } from './ModalCreditCard'
import { ModalMovement } from './ModalMovement'
import { ModalPayDebt } from './ModalPayDebt'
import { deleteCreditCard, deleteCreditCardMovement } from 'services/apiService'
import type { CreditCard, CreditCardMovement } from 'types'

const CreditCardsPage: React.FC = () => {
  const { creditCards, isLoading: loadingCards } = useCreditCards()
  const [selectedCardIdFilter, setSelectedCardIdFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'pending' | 'paid' | 'all'>('pending')

  // Modals state
  const [openCardModal, setOpenCardModal] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null)

  const [openMovementModal, setOpenMovementModal] = useState(false)
  const [activeCardForMovement, setActiveCardForMovement] = useState<CreditCard | null>(null)
  const [editingMovement, setEditingMovement] = useState<CreditCardMovement | null>(null)

  const [openPayModal, setOpenPayModal] = useState(false)
  const [activeCardForPay, setActiveCardForPay] = useState<CreditCard | null>(null)

  const activeCardIdForMovements = selectedCardIdFilter || (creditCards.length > 0 ? (creditCards[0].id || creditCards[0]._id) : '')

  const { movements, isLoading: loadingMovements } = useCreditCardMovements(
    activeCardIdForMovements,
    statusFilter === 'all' ? undefined : statusFilter
  )

  const triggerMutate = useCreditCardMutate(activeCardIdForMovements)

  // Calculations for KPI Summary Cards
  const totalDebt = creditCards.reduce((acc, c) => acc + (c.currentDebt ?? 0), 0)
  const totalLimit = creditCards.reduce((acc, c) => acc + (c.limit ?? 0), 0)
  const availableCredit = Math.max(0, totalLimit - totalDebt)

  const handleOpenAddCard = () => {
    setEditingCard(null)
    setOpenCardModal(true)
  }

  const handleOpenEditCard = (card: CreditCard) => {
    setEditingCard(card)
    setOpenCardModal(true)
  }

  const handleDeleteCard = async (card: CreditCard) => {
    if (window.confirm(`¿Estás seguro de eliminar la tarjeta "${card.name}"?`)) {
      const id = card.id || card._id
      await deleteCreditCard(id)
      triggerMutate()
    }
  }

  const handleOpenAddMovement = (card: CreditCard) => {
    setActiveCardForMovement(card)
    setEditingMovement(null)
    setOpenMovementModal(true)
  }

  const handleOpenEditMovement = (card: CreditCard, m: CreditCardMovement) => {
    setActiveCardForMovement(card)
    setEditingMovement(m)
    setOpenMovementModal(true)
  }

  const handleDeleteMovement = async (cardId: string, mId: string) => {
    if (window.confirm('¿Deseas eliminar este movimiento de tarjeta?')) {
      await deleteCreditCardMovement(cardId, mId)
      triggerMutate()
    }
  }

  const handleOpenPayDebt = (card: CreditCard) => {
    setActiveCardForPay(card)
    setOpenPayModal(true)
  }

  return (
    <>
      {/* Finper Standard Header Actions */}
      <HeaderButtons
        buttons={[
          { Icon: PlusOutlined, title: 'Nueva Tarjeta', onClick: handleOpenAddCard }
        ]}
        desktopSx={{ marginTop: -7 }}
      />

      {/* KPI Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3, mt: 1 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <KpiCard
            title='Deuda Total Acumulada'
            value={format.euro(totalDebt)}
            subtitle='Suma de deudas de tarjetas'
            icon={<DollarOutlined />}
            color='error'
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <KpiCard
            title='Tarjetas Activas'
            value={String(creditCards.length)}
            subtitle='En seguimiento'
            icon={<CreditCardOutlined />}
            color='primary'
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <KpiCard
            title='Crédito Disponible Total'
            value={format.euro(availableCredit)}
            subtitle='Límite restante disponible'
            icon={<AuditOutlined />}
            color='success'
          />
        </Grid>
      </Grid>

      {/* Credit Cards Grid */}
      {loadingCards
        ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
          )
        : creditCards.length === 0
          ? (
            <Alert severity='info' sx={{ cursor: 'pointer', mb: 3 }} onClick={handleOpenAddCard}>
              No tienes ninguna tarjeta de crédito registrada. Pulsa "Nueva Tarjeta" para añadir la primera.
            </Alert>
            )
          : (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {creditCards.map((card, idx) => {
                const id = card.id || card._id
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={id}>
                    <CreditCardCard
                      card={card}
                      index={idx}
                      onAddMovement={handleOpenAddMovement}
                      onPayDebt={handleOpenPayDebt}
                      onEdit={handleOpenEditCard}
                      onDelete={handleDeleteCard}
                    />
                  </Grid>
                )
              })}
            </Grid>
            )}

      {/* Movements Section in MainCard */}
      {creditCards.length > 0 && (
        <MainCard
          title='Movimientos de Tarjeta'
          secondary={
            <Stack direction='row' spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                select
                size='small'
                label='Tarjeta'
                value={selectedCardIdFilter}
                onChange={(e) => setSelectedCardIdFilter(e.target.value)}
                sx={{ minWidth: 160 }}
              >
                {creditCards.map((card) => {
                  const id = card.id || card._id
                  return (
                    <MenuItem key={id} value={id}>
                      {card.name}
                    </MenuItem>
                  )
                })}
              </TextField>

              <Tabs
                value={statusFilter}
                onChange={(_, val) => setStatusFilter(val)}
                textColor='primary'
                indicatorColor='primary'
              >
                <Tab label='Pendientes' value='pending' />
                <Tab label='Pagados' value='paid' />
                <Tab label='Todos' value='all' />
              </Tabs>
            </Stack>
          }
          content={false}
        >
          {loadingMovements
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
                        const id = m.id || m._id
                        const cardForMovement = creditCards.find(
                          (c) => (c.id || c._id) === m.creditCardId
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
                              {isPending && cardForMovement && (
                                <Stack direction='row' spacing={0.5} sx={{ justifyContent: 'center' }}>
                                  <Tooltip title='Editar movimiento'>
                                    <IconButton
                                      size='small'
                                      onClick={() => handleOpenEditMovement(cardForMovement, m)}
                                    >
                                      <EditOutlined style={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title='Eliminar movimiento'>
                                    <IconButton
                                      size='small'
                                      color='error'
                                      onClick={() => handleDeleteMovement(m.creditCardId, id)}
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
      )}

      {/* Modals */}
      <ModalCreditCard
        open={openCardModal}
        onClose={() => setOpenCardModal(false)}
        creditCard={editingCard}
        onSuccess={triggerMutate}
      />

      {activeCardForMovement && (
        <ModalMovement
          open={openMovementModal}
          onClose={() => setOpenMovementModal(false)}
          creditCardId={activeCardForMovement.id || activeCardForMovement._id}
          movement={editingMovement}
          onSuccess={triggerMutate}
        />
      )}

      <ModalPayDebt
        open={openPayModal}
        onClose={() => setOpenPayModal(false)}
        creditCard={activeCardForPay}
        onSuccess={triggerMutate}
      />
    </>
  )
}

export default CreditCardsPage
