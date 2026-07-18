import { Alert, Typography } from '@mui/material'
import { Yield } from 'types'
import { ConfirmModal } from 'components'
import { useYields } from 'hooks/useYields'
import { useSubmitError } from '../../hooks/useSubmitError'

interface Props {
  item: Yield
  onClose: () => void
  /** Called after a successful delete, in addition to onClose (e.g. to navigate away). */
  onDeleted?: () => void
}

const TYPE_LABEL: Record<string, string> = {
  interest: 'Remunerada',
  cashback: 'de Cashback'
}

const YieldRemoveModal = ({ item, onClose, onDeleted }: Props) => {
  const { removeYield } = useYields()
  const { error, runSubmit } = useSubmitError()

  const handleConfirm = () => runSubmit(() => removeYield(item._id), () => {
    onClose()
    onDeleted?.()
  })

  return (
    <ConfirmModal
      title='¿Quieres borrar el rendimiento?'
      description={
        <Typography variant='h6' color='textSecondary'>
          ¿Seguro que quieres eliminar el rendimiento <b>{TYPE_LABEL[item.type] ?? item.type}</b> de la cuenta <b>{item.account?.name}</b>?
          Se borrarán también todas sus liquidaciones y movimientos enlazados. Esta acción no se puede deshacer.
        </Typography>
      }
      onConfirm={handleConfirm}
      onClose={onClose}
      extra={error && <Alert severity='error' sx={{ mt: 1 }}>{error}</Alert>}
    />
  )
}

export default YieldRemoveModal
