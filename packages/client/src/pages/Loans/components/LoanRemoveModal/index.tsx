import { mutate } from 'swr'
import { Typography } from '@mui/material'

import { LOANS } from 'constants/api-paths'
import { deleteLoan } from 'services/apiService'
import { Loan } from 'types'
import { ConfirmModal } from 'components'

import { useApiError } from '../../hooks'

interface Props {
  loan: Loan
  onClose: () => void
}

const LoanRemoveModal = ({ loan, onClose }: Props) => {
  const { setApiError, ApiErrorMessage } = useApiError()

  const handleConfirm = async () => {
    const { error } = await deleteLoan(loan._id)
    if (error) { setApiError(error); return }
    onClose()
    await mutate<Loan[]>(LOANS, (loans) => loans?.filter(l => l._id !== loan._id))
  }

  return (
    <ConfirmModal
      title='¿Quieres borrar el préstamo?'
      description={
        <Typography variant='h6' color='textSecondary'>
          ¿Seguro que quieres eliminar el préstamo <b>{loan.name}</b>?
          Se borrarán también todos los pagos y eventos asociados. Esta acción no se puede deshacer.
        </Typography>
      }
      onConfirm={handleConfirm}
      onClose={onClose}
      extra={ApiErrorMessage}
    />
  )
}

export default LoanRemoveModal
