import React, { useState } from 'react'
import { Alert } from '@mui/material'
import { PlusOutlined } from '@ant-design/icons'

import { HeaderButtons } from 'components'
import { getId } from 'utils'
import { useCreditCards, useCreditCardMovements, useCreditCardMutate } from './hooks/useCreditCards'
import {
  CreditCardsSummary,
  CreditCardsGrid,
  CreditCardMovementsTable,
  ModalCreditCard,
  ModalMovement,
  ModalPayDebt
} from './components'
import { deleteCreditCard, deleteCreditCardMovement } from 'services/apiService'
import type { CreditCard, CreditCardMovement } from 'types'

type StatusFilter = 'pending' | 'paid' | 'all'

const CreditCardsPage: React.FC = () => {
  const { creditCards, isLoading: loadingCards, error: creditCardsError } = useCreditCards()
  const [selectedCardIdFilter, setSelectedCardIdFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')

  // Modals state
  const [openCardModal, setOpenCardModal] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null)

  const [openMovementModal, setOpenMovementModal] = useState(false)
  const [activeCardForMovement, setActiveCardForMovement] = useState<CreditCard | null>(null)
  const [editingMovement, setEditingMovement] = useState<CreditCardMovement | null>(null)

  const [openPayModal, setOpenPayModal] = useState(false)
  const [activeCardForPay, setActiveCardForPay] = useState<CreditCard | null>(null)

  const [actionError, setActionError] = useState<string | null>(null)

  const activeCardIdForMovements = selectedCardIdFilter || (creditCards.length > 0 ? getId(creditCards[0]) ?? '' : '')

  const { movements, isLoading: loadingMovements } = useCreditCardMovements(
    activeCardIdForMovements,
    statusFilter === 'all' ? undefined : statusFilter
  )

  const triggerMutate = useCreditCardMutate(activeCardIdForMovements)
  const mutateMovementCard = useCreditCardMutate(activeCardForMovement ? getId(activeCardForMovement) : undefined)
  const mutatePayCard = useCreditCardMutate(activeCardForPay ? getId(activeCardForPay) : undefined)

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
      const id = getId(card)
      if (!id) return
      const { error } = await deleteCreditCard(id)
      if (error) {
        setActionError(error)
        return
      }
      setActionError(null)
      triggerMutate()
    }
  }

  const handleOpenAddMovement = (card: CreditCard) => {
    setActiveCardForMovement(card)
    setEditingMovement(null)
    setOpenMovementModal(true)
  }

  const handleOpenEditMovement = (card: CreditCard, movement: CreditCardMovement) => {
    setActiveCardForMovement(card)
    setEditingMovement(movement)
    setOpenMovementModal(true)
  }

  const handleDeleteMovement = async (cardId: string, movementId: string) => {
    if (window.confirm('¿Deseas eliminar este movimiento de tarjeta?')) {
      const { error } = await deleteCreditCardMovement(cardId, movementId)
      if (error) {
        setActionError(error)
        return
      }
      setActionError(null)
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

      {/* Error state */}
      {creditCardsError && (
        <Alert severity='error' sx={{ mb: 3 }}>
          No se han podido cargar las tarjetas de crédito. Inténtalo de nuevo más tarde.
        </Alert>
      )}

      {actionError && (
        <Alert severity='error' sx={{ mb: 3 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      <CreditCardsSummary
        totalDebt={totalDebt}
        totalCards={creditCards.length}
        availableCredit={availableCredit}
      />

      <CreditCardsGrid
        creditCards={creditCards}
        isLoading={loadingCards}
        onAddCard={handleOpenAddCard}
        onAddMovement={handleOpenAddMovement}
        onPayDebt={handleOpenPayDebt}
        onEdit={handleOpenEditCard}
        onDelete={handleDeleteCard}
      />

      {creditCards.length > 0 && (
        <CreditCardMovementsTable
          creditCards={creditCards}
          movements={movements}
          isLoading={loadingMovements}
          selectedCardIdFilter={activeCardIdForMovements}
          onSelectCardIdFilter={setSelectedCardIdFilter}
          statusFilter={statusFilter}
          onSelectStatusFilter={setStatusFilter}
          onEditMovement={handleOpenEditMovement}
          onDeleteMovement={handleDeleteMovement}
        />
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
          creditCardId={getId(activeCardForMovement) ?? ''}
          movement={editingMovement}
          onSuccess={() => { mutateMovementCard(); triggerMutate() }}
        />
      )}

      <ModalPayDebt
        open={openPayModal}
        onClose={() => setOpenPayModal(false)}
        creditCard={activeCardForPay}
        onSuccess={() => { mutatePayCard(); triggerMutate() }}
      />
    </>
  )
}

export default CreditCardsPage
