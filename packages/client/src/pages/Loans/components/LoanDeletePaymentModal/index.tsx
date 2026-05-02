import { mutate } from 'swr'
import { Typography } from '@mui/material'

import { LOANS, LOAN_DETAIL } from 'constants/api-paths'
import { deleteLoanPayment } from 'services/apiService'
import { AmortizationRow } from 'types'
import { ConfirmModal } from 'components'

import { useApiError } from '../../hooks'

interface Props {
  loanId: string
  payment: AmortizationRow
  onClose: () => void
}

const LoanDeletePaymentModal = ({ loanId, payment, onClose }: Props) => {
  const { setApiError, ApiErrorMessage } = useApiError()

  const handleConfirm = async () => {
    const { error } = await deleteLoanPayment(loanId, payment._id!)
    if (error) { setApiError(error); return }
    await mutate(LOAN_DETAIL(loanId))
    await mutate(LOANS)
    onClose()
  }

  const dateLabel = new Date(payment.date).toLocaleDateString('es-ES')

  return (
    <ConfirmModal
      title='¿Eliminar cuota?'
      description={
        <Typography variant='body1' color='textSecondary'>
          ¿Seguro que quieres eliminar la cuota del <b>{dateLabel}</b>?
          Esta acción recalculará el capital pendiente del préstamo y no se puede deshacer.
        </Typography>
      }
      onConfirm={handleConfirm}
      onClose={onClose}
      extra={ApiErrorMessage}
      actionsAlign='between'
    />
  )
}

export default LoanDeletePaymentModal
