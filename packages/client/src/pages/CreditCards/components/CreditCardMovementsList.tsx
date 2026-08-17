import React from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'

import { ListContainer } from 'components'
import { getId } from 'utils'
import { CreditCardMovementItem } from './CreditCardMovementItem'
import type { CreditCardMovement } from 'types'

interface CreditCardMovementsListProps {
  movements: CreditCardMovement[]
  isLoading: boolean
  emptyMessage: string
  bank?: string | null
}

// Reutiliza el mismo patrón de lista (ListContainer + fila expandible)
// que la página de Movimientos (Transactions), para que ambos listados se vean iguales.
export const CreditCardMovementsList: React.FC<CreditCardMovementsListProps> = ({
  movements,
  isLoading,
  emptyMessage,
  bank
}) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (movements.length === 0) {
    return (
      <Typography color='text.secondary' sx={{ p: 4, textAlign: 'center' }}>
        {emptyMessage}
      </Typography>
    )
  }

  return (
    <ListContainer>
      {movements.map((movement) => (
        <CreditCardMovementItem key={getId(movement)} movement={movement} bank={bank} />
      ))}
    </ListContainer>
  )
}
