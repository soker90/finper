import React from 'react'
import { Box, Grid, CircularProgress, Alert } from '@mui/material'
import { getId } from 'utils'
import { CreditCardCard } from './CreditCardCard'
import type { CreditCard } from 'types'

interface CreditCardsGridProps {
  creditCards: CreditCard[]
  isLoading: boolean
  onAddCard: () => void
  onAddMovement: (card: CreditCard) => void
  onPayDebt: (card: CreditCard) => void
  onEdit: (card: CreditCard) => void
  onDelete: (card: CreditCard) => void
}

export const CreditCardsGrid: React.FC<CreditCardsGridProps> = ({
  creditCards,
  isLoading,
  onAddCard,
  onAddMovement,
  onPayDebt,
  onEdit,
  onDelete
}) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (creditCards.length === 0) {
    return (
      <Alert severity='info' sx={{ cursor: 'pointer', mb: 3 }} onClick={onAddCard}>
        No tienes ninguna tarjeta de crédito registrada. Pulsa "Nueva Tarjeta" para añadir la primera.
      </Alert>
    )
  }

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {creditCards.map((card, idx) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={getId(card)}>
          <CreditCardCard
            card={card}
            index={idx}
            onAddMovement={onAddMovement}
            onPayDebt={onPayDebt}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </Grid>
      ))}
    </Grid>
  )
}
