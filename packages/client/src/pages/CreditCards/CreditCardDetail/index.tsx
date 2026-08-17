import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { ArrowLeftOutlined, PlusOutlined, DollarOutlined, EditOutlined } from '@ant-design/icons'

import { BankIcon } from 'components'
import { useCreditCardDetail, useCreditCardMovements, useCreditCardMutate } from '../hooks/useCreditCards'
import { CreditCardMovementsList, ModalCreditCard, ModalMovement, ModalPayDebt } from '../components'

const CreditCardDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { creditCard, isLoading: loadingCard } = useCreditCardDetail(id)
  const { movements, isLoading: loadingMovements } = useCreditCardMovements(id, 'pending')
  const triggerMutate = useCreditCardMutate(id)

  const [openCardModal, setOpenCardModal] = useState(false)
  const [openMovementModal, setOpenMovementModal] = useState(false)
  const [openPayModal, setOpenPayModal] = useState(false)

  if (!id) {
    navigate('/tarjetas', { replace: true })
    return null
  }

  if (loadingCard) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!creditCard) {
    return (
      <Typography color='textSecondary' sx={{ mt: 4, textAlign: 'center' }}>
        Tarjeta no encontrada.
      </Typography>
    )
  }

  const handleOpenAddMovement = () => {
    setOpenMovementModal(true)
  }

  const cardBank = creditCard.logoBank || creditCard.account?.bank

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button startIcon={<ArrowLeftOutlined />} onClick={() => navigate('/tarjetas')} size='small'>
            Volver
          </Button>
          <Typography variant='h4'>{creditCard.name}</Typography>
          {cardBank && <BankIcon name={cardBank} width={24} height={24} />}
        </Box>
        <Stack direction='row' spacing={1} sx={{ flexWrap: 'wrap' }}>
          <Button variant='outlined' startIcon={<PlusOutlined />} onClick={handleOpenAddMovement}>
            Movimiento
          </Button>
          <Button
            variant='contained'
            color='success'
            startIcon={<DollarOutlined />}
            onClick={() => setOpenPayModal(true)}
            disabled={(creditCard.currentDebt ?? 0) <= 0}
          >
            Pagar Deuda
          </Button>
          <Button variant='outlined' startIcon={<EditOutlined />} onClick={() => setOpenCardModal(true)}>
            Editar
          </Button>
        </Stack>
      </Box>

      <Typography variant='subtitle1'>Movimientos pendientes</Typography>

      <CreditCardMovementsList
        movements={movements}
        isLoading={loadingMovements}
        emptyMessage='No hay movimientos pendientes para esta tarjeta.'
        bank={cardBank}
      />

      <ModalCreditCard
        open={openCardModal}
        onClose={() => setOpenCardModal(false)}
        creditCard={creditCard}
        onSuccess={triggerMutate}
      />

      <ModalMovement
        open={openMovementModal}
        onClose={() => setOpenMovementModal(false)}
        creditCardId={id}
        movement={null}
        onSuccess={triggerMutate}
      />

      <ModalPayDebt
        open={openPayModal}
        onClose={() => setOpenPayModal(false)}
        creditCard={creditCard}
        onSuccess={triggerMutate}
      />
    </Stack>
  )
}

export default CreditCardDetail
