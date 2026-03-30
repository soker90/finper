import { useState } from 'react'
import { Button, Card, CardActions, CardContent, CardHeader, Divider, FormHelperText, Modal, Typography } from '@mui/material'
import { mutate } from 'swr'

import { LOANS, LOAN_DETAIL } from 'constants/api-paths'
import { deleteLoanPayment } from 'services/apiService'
import { AmortizationRow } from 'types'

interface Props {
  loanId: string
  payment: AmortizationRow
  onClose: () => void
}

const LoanDeletePaymentModal = ({ loanId, payment, onClose }: Props) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [apiError, setApiError] = useState<string | undefined>(undefined)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const { error } = await deleteLoanPayment(loanId, payment._id!)
      if (error) { setApiError(error); return }
      await mutate(LOAN_DETAIL(loanId))
      await mutate(LOANS)
      onClose()
    } finally {
      setIsDeleting(false)
    }
  }

  const dateLabel = new Date(payment.date).toLocaleDateString('es-ES')

  return (
    <Modal
      onClose={onClose}
      open
      sx={{ maxWidth: 500, margin: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Card sx={{ mx: 2 }}>
        <CardHeader title='¿Eliminar cuota?' />
        <Divider />
        <CardContent>
          <Typography variant='body1' color='textSecondary'>
            ¿Seguro que quieres eliminar la cuota del <b>{dateLabel}</b>?
            Esta acción recalculará el capital pendiente del préstamo y no se puede deshacer.
          </Typography>
          {apiError && <FormHelperText error>{apiError}</FormHelperText>}
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'space-between' }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button color='error' variant='contained' disabled={isDeleting} onClick={handleDelete}>
            Eliminar
          </Button>
        </CardActions>
      </Card>
    </Modal>
  )
}

export default LoanDeletePaymentModal
