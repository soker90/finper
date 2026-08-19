import React from 'react'
import { Typography, MenuItem, TextField, Stack, useMediaQuery, useTheme } from '@mui/material'
import { CreditCardMovementsList } from './CreditCardMovementsList'
import { getId } from 'utils'
import type { CreditCard, CreditCardMovement } from 'types'

interface CreditCardMovementsTableProps {
  creditCards: CreditCard[]
  movements: CreditCardMovement[]
  isLoading: boolean
  selectedCardIdFilter: string
  onSelectCardIdFilter: (id: string) => void
}

export const CreditCardMovementsTable: React.FC<CreditCardMovementsTableProps> = ({
  creditCards,
  movements,
  isLoading,
  selectedCardIdFilter,
  onSelectCardIdFilter
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const selectedCard = creditCards.find((card) => getId(card) === selectedCardIdFilter)

  return (
    <>
      <Stack
        direction={isMobile ? 'column' : 'row'}
        spacing={2}
        sx={{
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          mt: 3,
          mb: 1
        }}
      >
        <Typography variant='subtitle1'>Últimos movimientos pendientes</Typography>

        <TextField
          select
          size='small'
          label='Tarjeta'
          value={selectedCardIdFilter}
          onChange={(event) => onSelectCardIdFilter(event.target.value)}
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
      </Stack>

      <CreditCardMovementsList
        movements={movements}
        isLoading={isLoading}
        emptyMessage='No hay movimientos pendientes para esta tarjeta.'
        bank={selectedCard?.logoBank || selectedCard?.account?.bank}
      />
    </>
  )
}
