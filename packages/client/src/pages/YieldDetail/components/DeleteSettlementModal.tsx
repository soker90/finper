import { Alert, Typography } from '@mui/material'
import { ConfirmModal } from 'components'
import { YieldSettlement } from 'types'
import { format } from 'utils'
import { useDeleteYieldSettlement } from 'hooks/useYields'
import { useSubmitError } from '../../Yields/hooks/useSubmitError'
import { useSnackbar } from 'contexts'

interface Props {
  yieldId: string
  settlement: YieldSettlement
  onClose: () => void
}

const DeleteSettlementModal = ({ yieldId, settlement, onClose }: Props) => {
  const deleteSettlement = useDeleteYieldSettlement()
  const { error, runSubmit } = useSubmitError()
  const { showSuccess } = useSnackbar()

  const label = settlement.settlementDate ? format.date(settlement.settlementDate) : 'Pendiente'
  const entriesCount = settlement.entries.length

  const handleConfirm = () => runSubmit(() => deleteSettlement(yieldId, settlement.id), () => {
    onClose()
    showSuccess('Liquidación eliminada')
  })

  return (
    <ConfirmModal
      title='¿Quieres borrar esta liquidación?'
      description={
        <Typography variant='h6' color='textSecondary'>
          ¿Seguro que quieres eliminar la liquidación <b>{label}</b>?
          {entriesCount > 0
            ? ` Sus ${entriesCount} movimiento${entriesCount === 1 ? '' : 's'} enlazado${entriesCount === 1 ? '' : 's'} quedará${entriesCount === 1 ? '' : 'n'} sin enlazar, pero no se borrará${entriesCount === 1 ? '' : 'n'}.`
            : ' No tiene movimientos enlazados.'}
          {' '}Esta acción no se puede deshacer.
        </Typography>
      }
      onConfirm={handleConfirm}
      onClose={onClose}
      extra={error && <Alert severity='error' sx={{ mt: 1 }}>{error}</Alert>}
    />
  )
}

export default DeleteSettlementModal
