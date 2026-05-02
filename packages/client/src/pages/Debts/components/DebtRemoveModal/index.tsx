import { mutate } from 'swr'
import { Typography } from '@mui/material'

import { DEBTS } from 'constants/api-paths'
import { deleteDebt } from 'services/apiService'
import { Debt } from 'types'
import { ConfirmModal } from 'components'

const DebtRemoveModal = ({
  debt,
  onClose
}: { debt: Debt, onClose: () => void }) => {
  const handleConfirm = async () => {
    await deleteDebt(debt._id as string)
    onClose()
    // @ts-ignore
    await mutate(DEBTS, async (debts: Debt[]) => {
      return debts.filter(d => d._id !== debt?._id)
    })
  }

  return (
    <ConfirmModal
      title='¿Quieres borrar la deuda?'
      description={
        <Typography variant='h6' color='textSecondary'>
          ¿Seguro que quieres eliminar la deuda de {debt.from} por un importe de {debt.amount}€?
        </Typography>
      }
      onConfirm={handleConfirm}
      onClose={onClose}
    />
  )
}

export default DebtRemoveModal
